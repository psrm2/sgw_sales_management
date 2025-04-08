// ---------- タブ切替処理 ----------
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

document.getElementById("defaultTab").click();

// ---------- ユーティリティ関数 ----------
function pad(n) {
  return n < 10 ? '0' + n : '' + n;
}

// ---------- グローバル変数 ----------
// 現在のグラフ対象の年月（初期は現在月）
let currentGraphYear = new Date().getFullYear();
let currentGraphMonth = new Date().getMonth() + 1;  // 1～12

// records, fares をグローバルスコープで保持する（初回取得分）
let records = [];
let fares = {};

// ---------- グラフ描画処理 ----------
function drawGraph(year, month) {
  // 対象期間を当月の1日～当月の末日とする
  const monthStart = `${year}-${pad(month)}-01`;
  const lastDay = new Date(year, month, 0).getDate();
  const monthEnd = `${year}-${pad(month)}-${pad(lastDay)}`;
  
  // 当月のレコードのみ抽出（record.date は "YYYY-MM-DD" 形式と仮定）
  let dailyTotals = {};
  records.forEach(record => {
    if (record.date >= monthStart && record.date <= monthEnd) {
      if (!dailyTotals[record.date]) dailyTotals[record.date] = 0;
      for (let key in record.quantities) {
        dailyTotals[record.date] += (record.quantities[key] || 0) * (fares[key] || 0);
      }
    }
  });
  const labels = Object.keys(dailyTotals).sort();
  const dataValues = labels.map(label => dailyTotals[label]);
  let monthLabel = year + "年" + month + "月";
  
  // 更新: 月ラベル表示
  document.getElementById("graphMonthLabel").textContent = monthLabel;
  
  // 既存のグラフがあれば破棄して再描画
  if (window.myChart) {
    window.myChart.destroy();
  }
  
  var ctx = document.getElementById('graphCanvas').getContext('2d');
  window.myChart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: labels,
      datasets: [{
        label: monthLabel + " 日別売上",
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

// ---------- 初回ロード時の処理 ----------
document.addEventListener('DOMContentLoaded', async function() {
  try {
    // API 経由で records と fares を取得
    const recordsResponse = await fetch('/api/records');
    records = await recordsResponse.json();
    console.log("Records:", records);
    
    const faresResponse = await fetch('/api/fares');
    fares = await faresResponse.json();
    
    // ---------- カレンダー描画 ----------
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
      // 表示月の合計金額を計算して上部に表示
      datesSet: function(info) {
        // 現在の表示期間の開始・終了
        const currentStart = info.view.currentStart;
        const currentEnd = info.view.currentEnd;
        let monthTotal = 0;
        records.forEach(record => {
          // 保存されている日付 (YYYY-MM-DD) に "T00:00:00" を付加してローカル解釈
          const recordDate = new Date(record.date + "T00:00:00");
          // 現在の表示月の範囲内の場合のみ集計
          if (recordDate >= currentStart && recordDate < currentEnd) {
            let dailyTotal = 0;
            for (let key in record.quantities) {
              dailyTotal += (record.quantities[key] || 0) * (fares[key] || 0);
            }
            monthTotal += dailyTotal;
          }
        });
        document.getElementById("monthTotal").textContent = "月合計: ¥" + monthTotal;
      },
      dateClick: function(info) {
        // 日付クリックで個数入力画面へ遷移
        window.location.href = '/input_quantity?date=' + info.dateStr;
      }
    });
    calendar.render();
  
    // ---------- グラフ初期描画（現在の月） ----------
    drawGraph(currentGraphYear, currentGraphMonth);
    
    // ---------- 矢印ボタンのイベントリスナー追加 ----------
    document.getElementById("prevMonth").addEventListener("click", function() {
      currentGraphMonth--;
      if (currentGraphMonth < 1) {
        currentGraphMonth = 12;
        currentGraphYear--;
      }
      drawGraph(currentGraphYear, currentGraphMonth);
    });
    document.getElementById("nextMonth").addEventListener("click", function() {
      currentGraphMonth++;
      if (currentGraphMonth > 12) {
        currentGraphMonth = 1;
        currentGraphYear++;
      }
      drawGraph(currentGraphYear, currentGraphMonth);
    });
  } catch (error) {
    console.error("Error loading dashboard:", error);
  }
});
