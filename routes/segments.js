const express = require('express');
const router = express.Router();
const segmentController = require('../controllers/segmentController');

router.post('/', segmentController.createSegment);
router.get('/', segmentController.getSegments);
router.get('/:id', segmentController.getSegmentById);
router.put('/:id', segmentController.updateSegment);
router.put('/:id/refresh', segmentController.refreshSegment);
router.get('/:id/export', segmentController.exportSegment);
router.delete('/:id', segmentController.deleteSegment);
router.get('/:id/edit', segmentController.getSegmentEditPage);

module.exports = router;