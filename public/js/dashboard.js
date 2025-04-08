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

// グラフ描画に必要なグローバル変数
let currentGraphYear, currentGraphMonth; // currentGraphMonth: 1～12
let allRecords = []; // /api/records から取得した全レコード
let userFares = {};  // /api/fares から取得した運賃情報
let myChart = null;

// 初期化処理：現在の日付を初期月として設定し、APIからレコードと運賃を取得してグラフを描画する
document.addEventListener('DOMContentLoaded', async function() {
  try {
    // API 経由で全レコードと運賃を取得
    const recordsResponse = await fetch('/api/records');
    allRecords = await recordsResponse.json();
    console.log("Records:", allRecords);
    const faresResponse = await fetch('/api/fares');
    userFares = await faresResponse.json();
    
    // 現在の日付を初期値に設定
    const today = new Date();
    currentGraphYear = today.getFullYear();
    currentGraphMonth = today.getMonth() + 1; // 1～12

    // 初回グラフ描画
    drawGraph();

    // ボタンにイベントリスナーを追加
    document.getElementById('prevMonthBtn').addEventListener('click', () => {
      changeGraphMonth(-1);
    });
    document.getElementById('nextMonthBtn').addEventListener('click', () => {
      changeGraphMonth(1);
    });
  } catch (error) {
    console.error("Error loading dashboard:", error);
  }
});

// 対象月を変える（delta: -1, 1 など）
function changeGraphMonth(delta) {
  currentGraphMonth += delta;
  if (currentGraphMonth < 1) {
    currentGraphMonth = 12;
    currentGraphYear--;
  } else if (currentGraphMonth > 12) {
    currentGraphMonth = 1;
    currentGraphYear++;
  }
  drawGraph();
}

// グラフ描画関数
function drawGraph() {
  // 更新ラベル
  document.getElementById('graphMonthLabel').textContent = currentGraphYear + "年" + currentGraphMonth + "月";
  
  // 当月の初日と末日を文字列で作成
  const pad = n => n < 10 ? '0' + n : '' + n;
  const startDateStr = `${currentGraphYear}-${pad(currentGraphMonth)}-01`;
  const lastDay = new Date(currentGraphYear, currentGraphMonth, 0).getDate();
  const endDateStr = `${currentGraphYear}-${pad(currentGraphMonth)}-${pad(lastDay)}`;
  
  // 対象月のレコードのみフィルタリング（保存される日付は "YYYY-MM-DD" 形式と仮定）
  const filtered = allRecords.filter(record => {
    return record.date >= startDateStr && record.date <= endDateStr;
  });
  
  // 日別売上を集計
  let dailyTotals = {};
  filtered.forEach(record => {
    // record.date は "YYYY-MM-DD" 形式
    if (!dailyTotals[record.date]) dailyTotals[record.date] = 0;
    for (let key in record.quantities) {
      dailyTotals[record.date] += (record.quantities[key] || 0) * (userFares[key] || 0);
    }
  });
  
  const labels = Object.keys(dailyTotals).sort();
  const dataValues = labels.map(label => dailyTotals[label]);
  
  // グラフを再描画
  const ctx = document.getElementById('graphCanvas').getContext('2d');
  if (myChart) {
    myChart.destroy();
  }
  myChart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: labels,
      datasets: [{
        label: currentGraphYear + "年" + currentGraphMonth + "月 日別売上",
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
