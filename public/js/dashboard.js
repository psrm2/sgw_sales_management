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

let graphYear, graphMonth;
let chartInstance; // Chart.js のインスタンス

document.addEventListener('DOMContentLoaded', async function() {
  // 初期値は現在の年月
  const today = new Date();
  graphYear = today.getFullYear();
  graphMonth = today.getMonth() + 1; // 1-12

  // 初期表示の更新
  updateGraph();

  // ボタンにイベントリスナーを設定
  document.getElementById('prevMonth').addEventListener('click', function() {
    graphMonth--;
    if (graphMonth < 1) {
      graphMonth = 12;
      graphYear--;
    }
    updateGraph();
  });
  
  document.getElementById('nextMonth').addEventListener('click', function() {
    graphMonth++;
    if (graphMonth > 12) {
      graphMonth = 1;
      graphYear++;
    }
    updateGraph();
  });
});

async function updateGraph() {
  try {
    // 表示中の月を表示
    document.getElementById('graphMonthLabel').textContent = graphYear + "年" + graphMonth + "月";

    // 全レコードを API 経由で取得
    const recordsResponse = await fetch('/api/records');
    const records = await recordsResponse.json();

    // 運賃情報も取得（ユーザーのもの）
    const faresResponse = await fetch('/api/fares');
    const fares = await faresResponse.json();

    // 当月の初日と末日を文字列で生成
    const pad = n => (n < 10 ? '0' + n : '' + n);
    const startISO = `${graphYear}-${pad(graphMonth)}-01`;
    const lastDay = new Date(graphYear, graphMonth, 0).getDate();
    const endISO = `${graphYear}-${pad(graphMonth)}-${pad(lastDay)}`;

    // 当月のデータだけフィルタリング（保存されている日付は "YYYY-MM-DD" 形式）
    let dailyTotals = {};
    records.forEach(record => {
      // 当月のレコードかを判定
      if (record.date >= startISO && record.date <= endISO) {
        if (!dailyTotals[record.date]) {
          dailyTotals[record.date] = 0;
        }
        for (let key in record.quantities) {
          dailyTotals[record.date] += (record.quantities[key] || 0) * (fares[key] || 0);
        }
      }
    });
    const labels = Object.keys(dailyTotals).sort();
    const dataValues = labels.map(label => dailyTotals[label]);

    // 既にチャートが存在すれば破棄
    if (chartInstance) {
      chartInstance.destroy();
    }
  
    var ctx = document.getElementById('graphCanvas').getContext('2d');
    chartInstance = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [{
          label: graphYear + "年" + graphMonth + "月 日別売上",
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
  } catch (error) {
    console.error("Error updating graph:", error);
  }
}
