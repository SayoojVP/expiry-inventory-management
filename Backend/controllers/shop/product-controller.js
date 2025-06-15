const Product = require('../../models/Product');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const mongoose = require('mongoose');

// Setup multer for file uploads
const storage = multer.diskStorage({
    destination: function(req, file, cb) {
        const uploadDir = 'public/uploads/products';
        // Create directory if it doesn't exist
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: function(req, file, cb) {
        cb(null, `product-${Date.now()}${path.extname(file.originalname)}`);
    }
});

const upload = multer({ 
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
    fileFilter: function(req, file, cb) {
        // Accept images only
        if (!file.originalname.match(/\.(jpg|jpeg|png|gif|webp)$/i)) {
            return cb(new Error('Only image files are allowed!'), false);
        }
        cb(null, true);
    }
}).single('productImage');

// Simplified version without multer for debugging
const addProduct = async(req, res) => {
    try {
        console.log("Request body received:", req.body);
        
        // Check if request body exists
        if (!req.body) {
            return res.status(400).json({
                success: false,
                message: "Request body is missing"
            });
        }
        
        // Extract values from request body with fallback values
        const name = req.body.name;
        const description = req.body.description;
        const price = parseFloat(req.body.price);
        const quantity = parseInt(req.body.quantity);
        const category = req.body.category;
        const sku = req.body.sku;
        const barcode = req.body.barcode;
        const discount = parseInt(req.body.discount) || 0;
        const expiryDate = req.body.expiryDate;
        const manufactureDate = req.body.manufactureDate;
        const imageUrl = req.body.imageUrl || 'https://placehold.co/600x400?text=No+Image';
        
        // Validate required fields
        if (!name || !description || isNaN(price) || isNaN(quantity) || !category || !sku) {
            return res.status(400).json({
                success: false,
                message: "Missing required fields"
            });
        }
        
        // Check if barcode already exists
        if (barcode) {
            const existingProductWithBarcode = await Product.findOne({ barcode });
            if (existingProductWithBarcode) {
                return res.status(400).json({
                    success: false,
                    message: "Barcode already exists for another product"
                });
            }
        }
        
        // Create product with all fields from frontend
        const product = new Product({
            name,
            description,
            price,
            quantity,
            category,
            sku,
            barcode: barcode || undefined, // Only set if barcode is provided
            discount,
            expiryDate,
            manufactureDate,
            imageUrl,
            serialNumber: sku // Use sku as serialNumber if needed
        });
        
        await product.save();
        
        res.status(201).json({
            success: true,
            product: product,
            message: "Product added successfully"
        });
    } catch (err) {
        console.log("Error adding product:", err);
        res.status(500).json({
            success: false,
            message: err.message || "Internal Server Error"
        });
    }
};

// Original version with multer
const addProductWithUpload = async(req, res) => {
    // Handle file upload
    upload(req, res, async function(err) {
        if (err instanceof multer.MulterError) {
            return res.status(400).json({
                success: false,
                message: `Image upload error: ${err.message}`
            });
        } else if (err) {
            return res.status(400).json({
                success: false,
                message: err.message
            });
        }
        
        try {
            console.log("Request body received:", req.body);
            
            // Check if request body exists
            if (!req.body) {
                return res.status(400).json({
                    success: false,
                    message: "Request body is missing"
                });
            }
            
            // Extract values from request body with fallback values
            const name = req.body.name;
            const description = req.body.description;
            const price = parseFloat(req.body.price);
            const quantity = parseInt(req.body.quantity);
            const category = req.body.category;
            const sku = req.body.sku;
            const barcode = req.body.barcode;
            const discount = parseInt(req.body.discount) || 0;
            const expiryDate = req.body.expiryDate;
            const manufactureDate = req.body.manufactureDate;
            const imageUrl = req.body.imageUrl;
            
            // Validate required fields
            if (!name || !description || isNaN(price) || isNaN(quantity) || !category || !sku) {
                return res.status(400).json({
                    success: false,
                    message: "Missing required fields"
                });
            }
            
            // Check if barcode already exists
            if (barcode) {
                const existingProductWithBarcode = await Product.findOne({ barcode });
                if (existingProductWithBarcode) {
                    return res.status(400).json({
                        success: false,
                        message: `E11000 duplicate key error collection: erp_db.products index: barcode_1 dup key: { barcode: "${barcode}" }`
                    });
                }
            }
            
            // Handle image path from file upload
            let productImageUrl = imageUrl;
            if (req.file) {
                productImageUrl = `/uploads/products/${req.file.filename}`;
            }
            
            // Create product with all fields from frontend
            const product = new Product({
                name,
                description,
                price,
                quantity,
                category,
                sku,
                barcode,
                discount,
                expiryDate,
                manufactureDate,
                imageUrl: productImageUrl,
                serialNumber: sku // Use sku as serialNumber if needed
            });
            
            await product.save();
            
            res.status(201).json({
                success: true,
                product: product,
                message: "Product added successfully"
            });
        } catch (err) {
            console.log("Error adding product:", err);
            res.status(500).json({
                success: false,
                message: err.message || "Internal Server Error"
            });
        }
    });
};

const getProducts=async(req,res)=>{
    try {
        const products = await Product.find({});
        res.status(200).json({
            success: true,
            products: products,
            message: "All Products fetched successfully"
        });
    } catch (err) {
        console.log("Error fetching products:", err);
        res.status(500).json({
            success: false,
            message: err.message || "Internal Server Error"
        });
    }
}

const getProduct=async(req,res)=>{
    try {
        const productId = req.params.id;
        console.log("Fetching product with ID:", productId);
        
        if (!productId || !mongoose.Types.ObjectId.isValid(productId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid product ID format"
            });
        }
        
        const product = await Product.findById(productId);
        console.log("Product found:", product ? "Yes" : "No");
        
        if (!product) {
            return res.status(404).json({
                success: false,
                message: "Product not found"
            });
        }
        
        res.status(200).json({
            success: true,
            product: product,
            message: "Product fetched successfully"
        });
    } catch (err) {
        console.log("Error fetching product:", err);
        res.status(500).json({
            success: false,
            message: err.message || "Internal Server Error"
        });
    }
}

const deleteProduct=async(req,res)=>{
    try {
        const productId = req.params.id;
        const deletedProduct = await Product.findByIdAndDelete(productId);
        
        if (!deletedProduct) {
            return res.status(404).json({
                success: false,
                message: "Product not found"
            });
        }
        
        res.status(200).json({
            success: true,
            message: "Product deleted successfully"
        });
    } catch (err) {
        console.log("Error deleting product:", err);
        res.status(500).json({
            success: false,
            message: err.message || "Internal Server Error"
        });
    }
}

// Update product stock after a sale
const updateStock = async (req, res) => {
    try {
        const { productId, quantity } = req.body;
        
        // Validate inputs
        if (!productId || !quantity) {
            return res.status(400).json({
                success: false,
                message: "Product ID and quantity are required"
            });
        }
        
        // Find the product
        const product = await Product.findById(productId);
        
        if (!product) {
            return res.status(404).json({
                success: false,
                message: "Product not found"
            });
        }
        
        // Check if there's enough stock
        if (product.quantity < quantity) {
            return res.status(400).json({
                success: false,
                message: "Insufficient stock available"
            });
        }
        
        // Update the product quantity
        product.quantity = product.quantity - quantity;
        
        // Save the updated product
        await product.save();
        
        res.status(200).json({
            success: true,
            message: "Product stock updated successfully",
            updatedQuantity: product.quantity
        });
    } catch (err) {
        console.log("Error updating product stock:", err);
        res.status(500).json({
            success: false,
            message: err.message || "Internal Server Error"
        });
    }
};

// Create a bill in the database
const createBill = async (req, res) => {
    try {
        const { items, totalAmount, date } = req.body;
        
        // Validate input
        if (!items || !Array.isArray(items) || items.length === 0) {
            return res.status(400).json({
                success: false,
                message: "Bill items are required"
            });
        }
        
        // Create a bill object
        const bill = {
            items,
            totalAmount,
            date: date || new Date(),
            status: 'completed'
        };
        
        // In a real implementation, you would save this to a Bill model
        // For now, just acknowledge receipt
        console.log("Bill created:", bill);
        
        res.status(201).json({
            success: true,
            message: "Bill created successfully",
            bill
        });
    } catch (err) {
        console.log("Error creating bill:", err);
        res.status(500).json({
            success: false,
            message: err.message || "Internal Server Error"
        });
    }
};

const updateProduct = async (req, res) => {
    try {
        const productId = req.params.id;
        
        // Find the product first to verify it exists
        const product = await Product.findById(productId);
        
        if (!product) {
            return res.status(404).json({
                success: false,
                message: "Product not found"
            });
        }
        
        console.log("Updating product:", productId);
        console.log("Update data received:", req.body);
        
        // Check what fields we're updating
        const updateData = {};
        
        // Handle discount specifically since it's a common update
        if (req.body.discount !== undefined) {
            const discount = parseFloat(req.body.discount);
            if (isNaN(discount) || discount < 0 || discount > 100) {
                return res.status(400).json({
                    success: false,
                    message: "Discount must be a number between 0 and 100"
                });
            }
            updateData.discount = discount;
        }
        
        // Handle other potential fields to update
        if (req.body.name) updateData.name = req.body.name;
        if (req.body.description) updateData.description = req.body.description;
        if (req.body.price !== undefined) updateData.price = parseFloat(req.body.price);
        if (req.body.quantity !== undefined) updateData.quantity = parseInt(req.body.quantity);
        if (req.body.category) updateData.category = req.body.category;
        if (req.body.imageUrl) updateData.imageUrl = req.body.imageUrl;
        
        // Update the product with new values
        const updatedProduct = await Product.findByIdAndUpdate(
            productId,
            updateData,
            { new: true } // Return the updated document
        );
        
        res.status(200).json({
            success: true,
            product: updatedProduct,
            message: "Product updated successfully"
        });
    } catch (err) {
        console.log("Error updating product:", err);
        res.status(500).json({
            success: false,
            message: err.message || "Internal Server Error"
        });
    }
};

module.exports={
    getProducts,
    getProduct,
    addProduct,
    deleteProduct,
    updateStock,
    createBill,
    updateProduct
}