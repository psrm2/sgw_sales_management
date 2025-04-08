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
    // API 経由で入力データと運賃を取得
    const recordsResponse = await fetch('/api/records');
    const records = await recordsResponse.json();
    console.log("Records:", records);

    const faresResponse = await fetch('/api/fares');
    const fares = await faresResponse.json();

    // FullCalendar の初期化
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
      datesSet: async function(info) {
        // API 経由で、表示中の月 (info.view.activeStart ～ info.view.activeEnd) の合計金額を取得
        const activeStart = info.view.activeStart;
        const year = activeStart.getFullYear();
        const month = activeStart.getMonth() + 1;
        try {
          const totalRes = await fetch(`/api/monthlyTotal?year=${year}&month=${month}`);
          const result = await totalRes.json();
          document.getElementById("monthTotal").textContent = "月合計: ¥" + result.monthTotal;
        } catch (error) {
          console.error("Error fetching monthly total:", error);
        }
      },
      dateClick: function(info) {
        // 日付クリックで個数入力画面へ遷移
        window.location.href = '/input_quantity?date=' + info.dateStr;
      }
    });
    calendar.render();

    // グラフ描画: 表示中の月の対象期間に対する日別売上集計
    const currentMonthStart = calendar.view.activeStart;
    const year = currentMonthStart.getFullYear();
    const month = currentMonthStart.getMonth() + 1;
    // API 経由で月合計と当月の日別データを再取得するか、上記 records からフィルタリングも可能です。ここでは records からフィルタリング
    let dailyTotals = {};
    records.forEach(record => {
      const recordDate = new Date(record.date);
      if (recordDate >= currentMonthStart && recordDate < calendar.view.activeEnd) {
        if (!dailyTotals[record.date]) dailyTotals[record.date] = 0;
        for (let key in record.quantities) {
          dailyTotals[record.date] += (record.quantities[key] || 0) * (fares[key] || 0);
        }
      }
    });
    const labels = Object.keys(dailyTotals).sort();
    const dataValues = labels.map(label => dailyTotals[label]);
    let monthLabel = year + "年" + month + "月";

    var ctx = document.getElementById('graphCanvas').getContext('2d');
    new Chart(ctx, {
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
  } catch (error) {
    console.error("Error loading dashboard:", error);
  }
});
