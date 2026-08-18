const express = require('express')
const cors = require('cors')
const path = require('path')
require('dotenv').config()

const app = express()
const PORT = process.env.PORT || 3000

// Middleware
app.use(cors())
app.use(express.json())

// API Routes
const apiRoutes = require('./routes/api')
app.use('/api', apiRoutes)

// Serve the admin UI
app.use('/admin', express.static(path.join(__dirname, 'admin-ui/dist')))
app.get(/^\/admin.*/, (req, res) => {
  res.sendFile(path.join(__dirname, 'admin-ui/dist/index.html'))
})

// Serve public static files (the customer facing site)
app.use(express.static(path.join(__dirname)))

// Start server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`)
})
