const express = require('express');
const multer = require('multer');
const router = express.Router();
const providerController = require('../controllers/provider.controller');
const protect = require('../middlewares/auth.middleware');
const { ALLOWED_MIME_TYPES, MAX_IMAGE_BYTES } = require('../utils/imagekit');

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: MAX_IMAGE_BYTES,
    files: 4,
  },
  fileFilter(req, file, callback) {
    if (!ALLOWED_MIME_TYPES.has(file.mimetype)) {
      return callback(new Error('Only JPG, PNG and WebP images are allowed.'));
    }

    return callback(null, true);
  },
});

function handleProviderImageUpload(req, res, next) {
  upload.array('images', 4)(req, res, (error) => {
    if (!error) return next();

    return res.status(400).json({
      success: false,
      message: error.message || 'Provider image upload failed.',
    });
  });
}

router.post('/', protect, providerController.createProvider);
router.get('/', providerController.listProviders);
router.post('/images', protect, handleProviderImageUpload, providerController.uploadProviderImages);
router.get('/me/profile', protect, providerController.getMyProvider);
router.put('/me/profile', protect, providerController.upsertMyProvider);
router.get('/:id/images', providerController.getProviderImages);
router.get('/:id', providerController.getProvider);
router.put('/:id', protect, providerController.updateProvider);
router.delete('/:id', protect, providerController.deleteProvider);

module.exports = router;
