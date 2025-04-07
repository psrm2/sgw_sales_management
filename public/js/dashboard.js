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

// 初期化処理（FullCalendar, Chart.js）
document.addEventListener('DOMContentLoaded', async function() {
  // 取得：入力データと運賃
  const recordsResponse = await fetch('/api/records');
  const records = await recordsResponse.json();
  
  const faresResponse = await fetch('/api/fares');
  const fares = await faresResponse.json();

  // カレンダー用イベント作成
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
      // 日付クリックで個数入力画面へ遷移
      window.location.href = '/input_quantity?date=' + info.dateStr;
    }
  });
  calendar.render();

  // グラフ用データ：当月の日別売上集計
  let dailyTotals = {};
  records.forEach(record => {
    // record.date は "YYYY-MM-DD" 形式と仮定
    if (!dailyTotals[record.date]) {
      dailyTotals[record.date] = 0;
    }
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
        y: {
          beginAtZero: true
        }
      }
    }
  });
});
