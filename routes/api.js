const express = require('express')
const router = express.Router()
const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const multer = require('multer')
const path = require('path')
const PDFDocument = require('pdfkit')

// Configure multer for image upload
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, '../images'))
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname))
  }
})
const upload = multer({ storage: storage })

const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-key-for-dev'

// Helper middleware for admin routes
const requireAdmin = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1] || req.query.token
  if (!token) return res.status(401).json({ error: 'Unauthorized' })
  try {
    const decoded = jwt.verify(token, JWT_SECRET)
    req.user = decoded
    next()
  } catch (err) {
    res.status(401).json({ error: 'Invalid token' })
  }
}

// ----------------------------------------------------
// PUBLIC ROUTES
// ----------------------------------------------------

// Get all products and categories
router.get('/products', async (req, res) => {
  try {
    const categories = await prisma.category.findMany()
    const products = await prisma.product.findMany({
      where: { isActive: true }
    })
    res.json({ categories, products })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// Create an order
router.post('/orders', async (req, res) => {
  const { customerName, customerPhone, customerAddress, items, subtotal, discount, deliveryCharges, tax, finalTotal } = req.body
  // items: { productId, quantity }[]
  
  if (!items || items.length === 0) {
    return res.status(400).json({ error: 'Order must contain items' })
  }

  try {
    const result = await prisma.$transaction(async (tx) => {
      let totalAmount = 0
      const orderItemsData = []

      // Validate stock and calculate total
      for (const item of items) {
        const product = await tx.product.findUnique({ where: { id: item.productId } })
        if (!product) throw new Error(`Product ${item.productId} not found`)
        if (product.stock < item.quantity) {
          throw new Error(`Not enough stock for ${product.name}. Available: ${product.stock}`)
        }

        // Deduct stock
        await tx.product.update({
          where: { id: product.id },
          data: { stock: product.stock - item.quantity }
        })

        const itemTotal = product.price * item.quantity
        totalAmount += itemTotal

        orderItemsData.push({
          productId: product.id,
          quantity: item.quantity,
          price: product.price
        })
      }

        // Create order
      const order = await tx.order.create({
        data: {
          customerName,
          customerPhone,
          customerAddress,
          subtotal: subtotal || totalAmount,
          discount: discount || 0,
          deliveryCharges: deliveryCharges || 0,
          tax: tax || 0,
          totalAmount: finalTotal || totalAmount, // finalTotal
          status: 'Pending',
          paymentStatus: 'Pending',
          items: {
            create: orderItemsData
          }
        },
        include: { items: true }
      })

      return order
    })

    res.json({ success: true, order: result })
  } catch (err) {
    res.status(400).json({ error: err.message })
  }
})

// ----------------------------------------------------
// ADMIN ROUTES
// ----------------------------------------------------

// Admin Login
router.post('/auth/login', async (req, res) => {
  const { email, password } = req.body
  const user = await prisma.user.findUnique({ where: { email } })
  if (!user) return res.status(401).json({ error: 'Invalid email or password.' })
  
  const valid = await bcrypt.compare(password, user.password)
  if (!valid) return res.status(401).json({ error: 'Invalid email or password.' })

  const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '1d' })
  res.json({ token, user: { id: user.id, email: user.email, name: user.name } })
})

// Dashboard Stats
router.get('/admin/dashboard', requireAdmin, async (req, res) => {
  const totalOrders = await prisma.order.count()
  const totalRevenueData = await prisma.order.aggregate({ 
    _sum: { totalAmount: true },
    where: { status: { notIn: ['Cancelled', 'CANCELLED'] } }
  })
  const outOfStockProducts = await prisma.product.count({ where: { stock: { lte: 0 } } })
  const pendingOrders = await prisma.order.count({ where: { status: { in: ['Pending', 'PENDING'] } } })

  res.json({
    totalOrders,
    totalRevenue: totalRevenueData._sum.totalAmount || 0,
    outOfStockProducts,
    pendingOrders
  })
})

// Get inventory (products with stock info)
router.get('/admin/inventory', requireAdmin, async (req, res) => {
  const products = await prisma.product.findMany({
    include: { category: true },
    orderBy: { createdAt: 'desc' }
  })
  res.json(products)
})

// Create new product
router.post('/admin/inventory', requireAdmin, upload.single('image'), async (req, res) => {
  const { id, name, price, oldPrice, isOnOffer, categoryId, stock, isActive } = req.body
  const imageId = req.file ? req.file.filename.replace(path.extname(req.file.filename), '') : null

  try {
    const product = await prisma.product.create({
      data: {
        id: id || `p-${Date.now()}`,
        name,
        price: parseFloat(price),
        oldPrice: oldPrice ? parseFloat(oldPrice) : null,
        isOnOffer: isOnOffer === 'true' || isOnOffer === true,
        categoryId,
        stock: stock ? parseInt(stock) : 100,
        isActive: isActive === 'true' || isActive === true,
        imageId: req.file ? req.file.filename : null // Keep extension so it's easier to serve if needed, wait index.html appends .jpg
      }
    })
    // NOTE: For index.html, it appends .jpg to imageId. If we uploaded a .png, we might have issues.
    // For simplicity, we just store the basename if we want index.html to append .jpg, OR we store the whole filename
    // Actually, I'll store the filename without extension if it's .jpg, or just store the filename and let index.html handle it.
    // Let's store req.file.filename in imageId. But wait, index.html does `<img src="images/${item.img}.jpg">`
    // I will adjust index.html later to not append .jpg if item.img already has an extension.
    if (req.file) {
      await prisma.product.update({
        where: { id: product.id },
        data: { imageId: req.file.filename }
      })
    }

    res.json(product)
  } catch (err) {
    res.status(400).json({ error: err.message })
  }
})

// Update product stock/details
router.put('/admin/inventory/:id', requireAdmin, upload.single('image'), async (req, res) => {
  const { id } = req.params
  const { name, stock, price, oldPrice, isOnOffer, categoryId, isActive } = req.body
  
  const data = {}
  if (name !== undefined) data.name = name
  if (stock !== undefined) data.stock = parseInt(stock)
  if (price !== undefined) data.price = parseFloat(price)
  if (oldPrice !== undefined) data.oldPrice = oldPrice ? parseFloat(oldPrice) : null
  if (isOnOffer !== undefined) data.isOnOffer = isOnOffer === 'true' || isOnOffer === true
  if (categoryId !== undefined) data.categoryId = categoryId
  if (isActive !== undefined) data.isActive = isActive === 'true' || isActive === true
  
  if (req.file) {
    data.imageId = req.file.filename
  }

  try {
    const product = await prisma.product.update({
      where: { id },
      data
    })
    res.json(product)
  } catch (err) {
    res.status(400).json({ error: err.message })
  }
})

// Delete product
router.delete('/admin/inventory/:id', requireAdmin, async (req, res) => {
  const { id } = req.params
  try {
    await prisma.product.delete({ where: { id } })
    res.json({ success: true })
  } catch (err) {
    res.status(400).json({ error: err.message })
  }
})

// Get orders
router.get('/admin/orders', requireAdmin, async (req, res) => {
  const orders = await prisma.order.findMany({
    include: { 
      items: {
        include: { product: true }
      }
    },
    orderBy: { createdAt: 'desc' }
  })
  res.json(orders)
})

// Update order status
router.put('/admin/orders/:id', requireAdmin, async (req, res) => {
  const { id } = req.params
  const { status } = req.body
  try {
    const order = await prisma.order.update({
      where: { id: parseInt(id) },
      data: { status }
    })
    res.json(order)
  } catch (err) {
    res.status(400).json({ error: err.message })
  }
})

// Generate Invoice PDF
router.get('/admin/orders/:id/invoice', requireAdmin, async (req, res) => {
  const { id } = req.params
  try {
    const order = await prisma.order.findUnique({
      where: { id: parseInt(id) },
      include: { items: { include: { product: true } } }
    })
    if (!order) return res.status(404).json({ error: 'Order not found' })

    const doc = new PDFDocument({ margin: 50 })
    res.setHeader('Content-disposition', `attachment; filename="Invoice-Maharaja-Order-${order.id}.pdf"`)
    res.setHeader('Content-type', 'application/pdf')
    doc.pipe(res)

    // Header
    doc.fontSize(24).font('Helvetica-Bold').text('Maharaja Nuts & More', { align: 'center' })
    doc.fontSize(10).font('Helvetica').fillColor('gray').text('Health & Happiness in Each Bite', { align: 'center' })
    doc.moveDown(2)
    
    // Invoice details
    doc.fillColor('black').fontSize(16).font('Helvetica-Bold').text('INVOICE', { underline: true })
    doc.fontSize(10).font('Helvetica').text(`Order ID: #${order.id}`)
    doc.text(`Date: ${order.createdAt.toISOString().split('T')[0]}`)
    doc.text(`Status: ${order.status}`)
    doc.moveDown()
    
    // Customer Info
    doc.fontSize(12).font('Helvetica-Bold').text('Billed To:')
    doc.fontSize(10).font('Helvetica')
    doc.text(`Name: ${order.customerName || 'N/A'}`)
    doc.text(`Phone: ${order.customerPhone || 'N/A'}`)
    doc.text(`Address: ${order.customerAddress || 'N/A'}`)
    doc.moveDown(2)
    
    // Items table header
    const tableTop = 330
    doc.font('Helvetica-Bold')
    doc.text('Item Description', 50, tableTop, { width: 250 })
    doc.text('Qty', 300, tableTop, { width: 50, align: 'center' })
    doc.text('Price (Rs)', 350, tableTop, { width: 80, align: 'right' })
    doc.text('Total (Rs)', 450, tableTop, { width: 80, align: 'right' })
    doc.moveDown(0.5)
    
    doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke()
    doc.moveDown(0.5)

    // Items
    doc.font('Helvetica')
    let y = doc.y
    order.items.forEach(item => {
      doc.text(item.product.name, 50, y, { width: 250 })
      doc.text(item.quantity.toString(), 300, y, { width: 50, align: 'center' })
      doc.text(item.price.toLocaleString('en-IN'), 350, y, { width: 80, align: 'right' })
      doc.text((item.price * item.quantity).toLocaleString('en-IN'), 450, y, { width: 80, align: 'right' })
      y += 20
    })
    
    doc.y = y
    doc.moveDown()
    doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke()
    doc.moveDown(1)
    
    // Total
    doc.fontSize(14).font('Helvetica-Bold').text(`Total Amount: Rs. ${order.totalAmount.toLocaleString('en-IN')}`, 350, doc.y, { align: 'right', width: 180 })
    
    // Footer
    doc.moveDown(4)
    doc.fontSize(10).font('Helvetica').fillColor('gray').text('Thank you for shopping with Maharaja Nuts & More!', { align: 'center' })

    doc.end()
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

module.exports = router
