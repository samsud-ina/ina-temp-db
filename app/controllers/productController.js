const { v2: cloudinary } = require('cloudinary');

const db = require('../config/dbConfig.js');
const statusCode = require('../config/statusCode.js');
const baseError = require('../middleware/error.js');

function query(sql, params = []) {
    return new Promise((resolve, reject) => {
        db.pool.query(sql, params, (error, results) => {
            if (error) {
                return reject(error);
            }
            return resolve(results);
        });
    });
}

function toBoolean(value, defaultValue = true) {
    if (value === undefined || value === null || value === '') {
        return defaultValue;
    }

    if (typeof value === 'boolean') {
        return value;
    }

    const normalized = String(value).trim().toLowerCase();
    return normalized === 'true' || normalized === '1' || normalized === 'yes';
}

function configureCloudinary() {
    if (process.env.CLOUDINARY_URL) {
        cloudinary.config({ secure: true });
        return true;
    }

    const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
    const apiKey = process.env.CLOUDINARY_API_KEY;
    const apiSecret = process.env.CLOUDINARY_API_SECRET;

    if (!cloudName || !apiKey || !apiSecret) {
        return false;
    }

    cloudinary.config({
        cloud_name: cloudName,
        api_key: apiKey,
        api_secret: apiSecret,
        secure: true
    });
    return true;
}

async function uploadImageToCloudinary(fileBuffer, fileName, mimeType) {
    if (!configureCloudinary()) {
        return {
            imageUrl: '',
            fileId: ''
        };
    }

    const folder = process.env.CLOUDINARY_FOLDER || 'tempdb/products';
    const publicIdBase = fileName ? String(fileName).split('.')[0] : `product-${Date.now()}`;

    const uploadResult = await new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
            {
                folder,
                resource_type: 'image',
                public_id: publicIdBase,
                overwrite: false,
                unique_filename: true
            },
            (error, result) => {
                if (error) {
                    return reject(error);
                }
                return resolve(result);
            }
        );

        stream.end(fileBuffer);
    });

    return {
        fileId: uploadResult.public_id,
        imageUrl: uploadResult.secure_url
    };
}

async function deleteCloudinaryFile(fileId) {
    if (!fileId || !configureCloudinary()) return;

    try {
        await cloudinary.uploader.destroy(fileId, {
            resource_type: 'image'
        });
    } catch (error) {
        // Ignore deletion errors so product update/delete can still continue.
    }
}

exports.getProducts = async (request, response) => {
    try {
        const userId = request.query.userId;

        if (!userId) {
            return response.json({
                code: statusCode.bad_request,
                message: 'userId is required'
            });
        }

        const results = await query(
            `
      SELECT
        id,
        user_id AS userId,
        sku,
        name,
        price,
        image_url AS imageUrl,
        image_file_id AS imageFileId,
        is_active AS isActive,
        created_at AS createdAt,
        updated_at AS updatedAt
      FROM products
      WHERE user_id = ?
      ORDER BY id DESC
      `,
            [userId]
        );

        return response.json({
            code: statusCode.success,
            message: 'Success get products',
            data: results
        });
    } catch (error) {
        return baseError.handleError(error, response);
    }
};

exports.getProduct = async (request, response) => {
    try {
        const id = Number(request.query.id || 0);
        const userId = request.query.userId;

        if (!id || !userId) {
            return response.json({
                code: statusCode.bad_request,
                message: 'id and userId are required'
            });
        }

        const results = await query(
            `
      SELECT
        id,
        user_id AS userId,
        sku,
        name,
        price,
        image_url AS imageUrl,
        image_file_id AS imageFileId,
        is_active AS isActive,
        created_at AS createdAt,
        updated_at AS updatedAt
      FROM products
      WHERE id = ? AND user_id = ?
      LIMIT 1
      `,
            [id, userId]
        );

        if (!results.length) {
            return response.json({
                code: statusCode.empty_data,
                message: 'Product not found'
            });
        }

        return response.json({
            code: statusCode.success,
            message: 'Success get product',
            data: results[0]
        });
    } catch (error) {
        return baseError.handleError(error, response);
    }
};

exports.addProduct = async (request, response) => {
    try {
        const { userId, sku, name, price, isActive } = request.body;

        if (!userId || !name) {
            return response.json({
                code: statusCode.bad_request,
                message: 'userId and name are required'
            });
        }

        const normalizedSku = String(sku || '').trim();
        if (normalizedSku) {
            const skuResults = await query(
                'SELECT id FROM products WHERE user_id = ? AND sku = ? LIMIT 1',
                [userId, normalizedSku]
            );

            if (skuResults.length) {
                return response.json({
                    code: statusCode.already_exists,
                    message: 'SKU already exists'
                });
            }
        }

        let imageUrl = '';
        let imageFileId = '';

        if (request.file && request.file.buffer) {
            const uploaded = await uploadImageToCloudinary(
                request.file.buffer,
                request.file.originalname,
                request.file.mimetype
            );

            imageUrl = uploaded.imageUrl;
            imageFileId = uploaded.fileId;
        }

        const insertResults = await query(
            `
      INSERT INTO products
      (user_id, sku, name, price, image_url, image_file_id, is_active)
      VALUES (?, ?, ?, ?, ?, ?, ?)
      `,
            [
                userId,
                normalizedSku,
                name,
                Number(price || 0),
                imageUrl,
                imageFileId,
                toBoolean(isActive, true)
            ]
        );

        return response.json({
            code: statusCode.success,
            message: 'Product created',
            data: {
                id: insertResults.insertId,
                imageUrl
            }
        });
    } catch (error) {
        return baseError.handleError(error, response);
    }
};

exports.updateProduct = async (request, response) => {
    try {
        const { id, userId, sku, name, price, isActive } = request.body;
        const productId = Number(id || 0);

        if (!productId || !userId) {
            return response.json({
                code: statusCode.bad_request,
                message: 'id and userId are required'
            });
        }

        const productRows = await query(
            'SELECT * FROM products WHERE id = ? AND user_id = ? LIMIT 1',
            [productId, userId]
        );

        if (!productRows.length) {
            return response.json({
                code: statusCode.empty_data,
                message: 'Product not found'
            });
        }

        const current = productRows[0];
        const normalizedSku = sku !== undefined ? String(sku || '').trim() : current.sku;

        if (normalizedSku) {
            const skuRows = await query(
                'SELECT id FROM products WHERE user_id = ? AND sku = ? AND id <> ? LIMIT 1',
                [userId, normalizedSku, productId]
            );

            if (skuRows.length) {
                return response.json({
                    code: statusCode.already_exists,
                    message: 'SKU already exists'
                });
            }
        }

        let imageUrl = current.image_url || '';
        let imageFileId = current.image_file_id || '';

        if (request.file && request.file.buffer) {
            await deleteCloudinaryFile(imageFileId);
            const uploaded = await uploadImageToCloudinary(
                request.file.buffer,
                request.file.originalname,
                request.file.mimetype
            );
            imageUrl = uploaded.imageUrl;
            imageFileId = uploaded.fileId;
        }

        await query(
            `
      UPDATE products
      SET
        sku = ?,
        name = ?,
        price = ?,
        image_url = ?,
        image_file_id = ?,
        is_active = ?,
        updated_at = NOW()
      WHERE id = ? AND user_id = ?
      `,
            [
                normalizedSku,
                name !== undefined ? name : current.name,
                price !== undefined ? Number(price) : current.price,
                imageUrl,
                imageFileId,
                isActive !== undefined ? toBoolean(isActive, true) : current.is_active,
                productId,
                userId
            ]
        );

        return response.json({
            code: statusCode.success,
            message: 'Product updated',
            data: {
                id: productId,
                imageUrl
            }
        });
    } catch (error) {
        return baseError.handleError(error, response);
    }
};

exports.deleteProduct = async (request, response) => {
    try {
        const id = Number(request.body.id || 0);
        const userId = request.body.userId;

        if (!id || !userId) {
            return response.json({
                code: statusCode.bad_request,
                message: 'id and userId are required'
            });
        }

        const rows = await query(
            'SELECT image_file_id FROM products WHERE id = ? AND user_id = ? LIMIT 1',
            [id, userId]
        );

        if (!rows.length) {
            return response.json({
                code: statusCode.empty_data,
                message: 'Product not found'
            });
        }

        await deleteCloudinaryFile(rows[0].image_file_id || '');

        await query('DELETE FROM products WHERE id = ? AND user_id = ?', [id, userId]);

        return response.json({
            code: statusCode.success,
            message: 'Product deleted'
        });
    } catch (error) {
        return baseError.handleError(error, response);
    }
};