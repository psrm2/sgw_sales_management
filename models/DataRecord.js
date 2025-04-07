const mongoose = require('mongoose');

const DataRecordSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  date: String, // 例："2024-12-01"
  quantities: {} // 例：{ "一般宅配": 10, "代引き": 5, ... }
});

module.exports = mongoose.model('DataRecord', DataRecordSchema);
