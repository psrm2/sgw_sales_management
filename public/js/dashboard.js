function openTab(evt, tabName) {
  var i, tabcontent, tablinks;
  tabcontent = document.getElementsByClassName("tabcontent");
  for (i = 0; i < tabcontent.length; i++) {
    tabcontent[i].style.display = "none";
  }
  tablinks = document.getElementsByClassName("tablink");
  for (i = 0; i < tablinks.length; i++) {
    tablinks[i].className = tablinks[i].className.replace(" active", "");
  }
  document.getElementById(tabName).style.display = "block";
  evt.currentTarget.className += " active";
}

// 初期タブを開く
document.getElementById("defaultTab").click();

document.addEventListener('DOMContentLoaded', async function() {
  // API 経由でユーザーの入力データと運賃を取得
  const recordsResponse = await fetch('/api/records');
  const records = await recordsResponse.json();
  
  const faresResponse = await fetch('/api/fares');
  const fares = await faresResponse.json();

  // 各レコードから日別合計金額を算出し、イベントとして設定
  const events = records.map(record => {
    let total = 0;
    for (let key in record.quantities) {
      total += (record.quantities[key] || 0) * (fares[key] || 0);
    }
    return {
      title: '¥' + total,
      start: record.date
    };
  });

  var calendarEl = document.getElementById('calendar');
  var calendar = new FullCalendar.Calendar(calendarEl, {
    initialView: 'dayGridMonth',
    events: events,
    dateClick: function(info) {
      // 日付クリックで、その日の入力データ編集画面へ遷移
      window.location.href = '/input_quantity?date=' + info.dateStr;
    }
  });
  calendar.render();

  // グラフ表示例：当月の日別売上集計（Chart.js 使用）
  let dailyTotals = {};
  records.forEach(record => {
    if (!dailyTotals[record.date]) dailyTotals[record.date] = 0;
    for (let key in record.quantities) {
      dailyTotals[record.date] += (record.quantities[key] || 0) * (fares[key] || 0);
    }
  });
  const labels = Object.keys(dailyTotals).sort();
  const dataValues = labels.map(label => dailyTotals[label]);

  var ctx = document.getElementById('graphCanvas').getContext('2d');
  var myChart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: labels,
      datasets: [{
        label: '日別売上',
        data: dataValues,
        backgroundColor: 'rgba(0, 123, 255, 0.5)'
      }]
    },
    options: {
      scales: {
        y: { beginAtZero: true }
      }
    }
  });
});

// MongoDB 初期化用関数（ログインユーザーが "deldb" の場合のみ表示されるボタンから呼ばれる）
async function resetDatabase() {
  if (!confirm("本当に MongoDB を初期化してすべてのデータを削除しますか？")) return;
  try {
    const response = await fetch('/api/reset', { method: 'POST' });
    if (response.ok) {
      alert("データベースを初期化しました");
      location.reload();
    } else {
      const result = await response.json();
      alert("初期化に失敗しました: " + result.error);
    }
  } catch (err) {
    alert("エラーが発生しました: " + err.message);
  }
}
