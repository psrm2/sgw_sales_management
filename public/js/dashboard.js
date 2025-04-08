let records = [];         // API から取得した全レコード
let fares = {};           // API から取得した運賃情報
let chartInstance = null; // Chart.js のインスタンス
let currentGraphMonth = new Date(); // 現在表示中の月 (初期は現在月)

// 日付は当月の1日にリセット
currentGraphMonth.setDate(1);

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
  try {
    // API 経由でレコードと運賃情報を取得（全期間分を取得）
    const recordsResponse = await fetch('/api/records');
    records = await recordsResponse.json();
    console.log("Records:", records);

    const faresResponse = await fetch('/api/fares');
    fares = await faresResponse.json();

    // FullCalendar の初期化（カレンダータブは引き続き既存の実装）
    var calendarEl = document.getElementById('calendar');
    var calendar = new FullCalendar.Calendar(calendarEl, {
      initialView: 'dayGridMonth',
      events: records.map(record => {
        let total = 0;
        for (let key in record.quantities) {
          total += (record.quantities[key] || 0) * (fares[key] || 0);
        }
        return {
          title: '¥' + total,
          start: record.date
        };
      }),
      datesSet: function(info) {
        // FullCalendar の表示期間の activeStart と activeEnd は使用せず、グラフは別途 API を使用
        // カレンダー上部の月合計は別途 /api/monthlyTotal を使用するか、同様に records からフィルタする
        // ※ カレンダー自体は既存の実装で表示
      },
      dateClick: function(info) {
        window.location.href = '/input_quantity?date=' + info.dateStr;
      }
    });
    calendar.render();

    // 初期状態のグラフ描画
    updateGraph();

    // 矢印ボタンのイベントリスナーを設定
    document.getElementById("prevMonth").addEventListener('click', function() {
      currentGraphMonth.setMonth(currentGraphMonth.getMonth() - 1);
      updateGraph();
    });
    document.getElementById("nextMonth").addEventListener('click', function() {
      currentGraphMonth.setMonth(currentGraphMonth.getMonth() + 1);
      updateGraph();
    });
  } catch (error) {
    console.error("Error loading dashboard:", error);
  }
});

function updateGraph() {
  // 当月の初日と末日を計算 (Date 型)
  const year = currentGraphMonth.getFullYear();
  const month = currentGraphMonth.getMonth();
  const monthStart = new Date(year, month, 1);
  const monthEnd = new Date(year, month + 1, 1); // 翌月の1日
  // Update グラフ上部の月表示
  document.getElementById("graphMonthLabel").textContent = `${year}年${month + 1}月`;

  // records から当月のレコードのみをフィルタリング
  let filteredRecords = records.filter(record => {
    // 保存されている record.date は "YYYY-MM-DD" 形式、"T00:00:00" 付加してローカル時間として扱う
    const recordDate = new Date(record.date + "T00:00:00");
    return recordDate >= monthStart && recordDate < monthEnd;
  });

  // 日別売上集計
  let dailyTotals = {};
  filteredRecords.forEach(record => {
    // record.date は文字列 "YYYY-MM-DD" をキーとして利用
    if (!dailyTotals[record.date]) dailyTotals[record.date] = 0;
    for (let key in record.quantities) {
      dailyTotals[record.date] += (record.quantities[key] || 0) * (fares[key] || 0);
    }
  });
  const labels = Object.keys(dailyTotals).sort();
  const dataValues = labels.map(label => dailyTotals[label]);

  // Chart.js でグラフ更新
  const ctx = document.getElementById('graphCanvas').getContext('2d');
  if (chartInstance) {
    chartInstance.data.labels = labels;
    chartInstance.data.datasets[0].data = dataValues;
    chartInstance.data.datasets[0].label = `${year}年${month + 1}月 日別売上`;
    chartInstance.update();
  } else {
    chartInstance = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [{
          label: `${year}年${month + 1}月 日別売上`,
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
  }
}
