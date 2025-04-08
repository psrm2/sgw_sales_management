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
      // 表示されている月の境界を利用して、当月の合計金額を計算する
      datesSet: function(info) {
        // calendar.view.currentStart/currentEnd は FullCalendar の内部で決定された表示領域（Date オブジェクト）
        const currentStart = info.view.currentStart; // 表示月の開始日（ローカル）
        const currentEnd = info.view.currentEnd;     // 翌月の1日（ローカル）、※当月末日より翌日の 0:00 として返ることが多い
        let monthTotal = 0;
        records.forEach(record => {
          // 保存されている日付は "YYYY-MM-DD" 形式なので、T00:00:00を付加してローカル解釈
          const recordDate = new Date(record.date + "T00:00:00");
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
  
    // グラフ描画: 当月の日別売上集計
    const currentMonthStart = calendar.view.currentStart;
    const currentMonthEnd = calendar.view.currentEnd;
    const year = currentMonthStart.getFullYear();
    const month = currentMonthStart.getMonth() + 1;
    let dailyTotals = {};
    records.forEach(record => {
      // 同様に、保存されている日付をローカル時間として解釈
      const recordDate = new Date(record.date + "T00:00:00");
      if (recordDate >= currentMonthStart && recordDate < currentMonthEnd) {
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
