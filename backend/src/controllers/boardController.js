const db = require('../db');

exports.getBoardsStatus = async (req, res) => {
  try {
    const boards = db.digitalBoards.find();
    return res.status(200).json({
      success: true,
      count: boards.length,
      boards
    });
  } catch (err) {
    console.error('[Board Status Error]', err);
    return res.status(500).json({ success: false, message: 'Failed to retrieve digital boards.' });
  }
};

exports.overrideBoard = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, custom_message, lane_allocation } = req.body;

    const board = db.digitalBoards.findById(id);
    if (!board) {
      return res.status(404).json({ success: false, message: 'Digital board not found.' });
    }

    const updates = {};
    if (status) updates.status = status;
    if (lane_allocation) updates.lane_allocation = lane_allocation;
    if (custom_message) {
      updates.current_messages = {
        ...board.current_messages,
        ...custom_message
      };
    }

    const updated = db.digitalBoards.update(id, updates);

    // Notify connected clients via global socket if available
    if (req.app.get('io')) {
      req.app.get('io').emit('boards:broadcast', {
        boardId: id,
        status: updated.status,
        messages: updated.current_messages,
        laneAllocation: updated.lane_allocation,
        overridden: true,
        timestamp: new Date().toISOString()
      });
    }

    return res.status(200).json({
      success: true,
      message: `Digital Board ${id} successfully overridden by municipal operator.`,
      board: updated
    });
  } catch (err) {
    console.error('[Board Override Error]', err);
    return res.status(500).json({ success: false, message: 'Failed to override board.' });
  }
};
