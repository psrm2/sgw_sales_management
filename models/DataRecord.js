const mongoose = require('mongoose');

const DataRecordSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  date: String, // ISO 形式の日付文字列（例："2024-12-01"）
  quantities: {} // 各項目の数量（例：{ "一般宅配": 10, "代引き": 5 }）
});

module.exports = mongoose.model('DataRecord', DataRecordSchema);
