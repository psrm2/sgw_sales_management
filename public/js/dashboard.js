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
    // ユーザーの入力データと運賃を API 経由で取得
    const recordsResponse = await fetch('/api/records');
    const records = await recordsResponse.json();
    console.log("Records:", records);

    const faresResponse = await fetch('/api/fares');
    const fares = await faresResponse.json();

    // FullCalendar の初期化
    var calendarEl = document.getElementById('calendar');
    var calendar = new FullCalendar.Calendar(calendarEl, {
      initialView: 'dayGridMonth',
      // FullCalendar の activeStart/activeEnd を使い、表示される月のデータに限定する
      datesSet: function(info) {
        // info.view.activeStart / activeEnd は、現在の月の boundaries（例：2024-12-01 ～ 2025-01-01）となる
        const currentMonthStart = info.view.activeStart;
        const currentMonthEnd = info.view.activeEnd;
        let monthTotal = 0;
        // 計算対象は activeStart から activeEnd の範囲内のレコードのみ
        records.forEach(record => {
          const recordDate = new Date(record.date);
          if (recordDate >= currentMonthStart && recordDate < currentMonthEnd) {
            let dailyTotal = 0;
            for (let key in record.quantities) {
              dailyTotal += (record.quantities[key] || 0) * (fares[key] || 0);
            }
            monthTotal += dailyTotal;
          }
        });
        document.getElementById("monthTotal").textContent = "月合計: ¥" + monthTotal;
      },
      // 既存のレコードからイベントを生成する際も、
      // activeStart/activeEnd に基づいて表示対象とするのではなく、全レコードは表示（※カレンダー上ではセルの多くは先月・翌月の日付となるため）
      events: records.map(record => {
        let total = 0;
        // ※ イベント表示については、全レコードの合計金額で表示
        for (let key in record.quantities) {
          total += (record.quantities[key] || 0) * (fares[key] || 0);
        }
        return {
          title: '¥' + total,
          start: record.date
        };
      }),
      // 日付クリックは編集不可（管理者用の場合も閲覧専用）
      dateClick: function(info) {
        alert("閲覧専用です。編集はできません。");
      }
    });
    calendar.render();

    // グラフ描画用に、対象月（activeStart ～ activeEnd）の日別売上を集計
    const currentMonthStart = calendar.view.activeStart;
    const currentMonthEnd = calendar.view.activeEnd;

    let dailyTotals = {};
    // activeStart ～ activeEnd の範囲内のレコードのみ対象
    records.forEach(record => {
      const recordDate = new Date(record.date);
      if (recordDate >= currentMonthStart && recordDate < currentMonthEnd) {
        if (!dailyTotals[record.date]) dailyTotals[record.date] = 0;
        for (let key in record.quantities) {
          dailyTotals[record.date] += (record.quantities[key] || 0) * (fares[key] || 0);
        }
      }
    });
    const labels = Object.keys(dailyTotals).sort();
    const dataValues = labels.map(label => dailyTotals[label]);

    // グラフに現在の月（日別データ）と何月かも表示する
    let monthLabel = currentMonthStart.getFullYear() + "年" + (currentMonthStart.getMonth() + 1) + "月";
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
    console.error("Error loading calendar:", error);
  }
});
