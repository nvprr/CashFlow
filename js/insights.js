/* === SMART INSIGHTS MODULE (no AI, just math) === */
const Insights = (() => {
  const render = () => {
    const container = document.getElementById('insights-container');
    if (!container) return;
    const all = Transactions.getAll();
    const thisMonth = Transactions.getThisMonth();

    if (all.length < 2) {
      container.innerHTML = `<div class="insight-card"><span class="insight-icon">💡</span><span class="insight-text">Dodaj kilka transakcji, aby zobaczyć analizy.</span></div>`;
      return;
    }

    const insights = [];
    const settings = Storage.getSettings();
    const expenses = thisMonth.filter(t => t.type === 'expense');
    const income = thisMonth.filter(t => t.type === 'income');
    const summary = Transactions.calcSummary(thisMonth);

    // Top spending category
    if (expenses.length) {
      const byCat = {};
      expenses.forEach(t => { byCat[t.categoryId] = (byCat[t.categoryId] || 0) + t.amount; });
      const [topId] = Object.entries(byCat).sort((a,b)=>b[1]-a[1])[0];
      const cat = Categories.getById(topId, 'expense');
      insights.push({ icon: cat.emoji, text: `Najwięcej wydajesz na <strong>${cat.name}</strong> — ${formatCurrency(byCat[topId], settings.currency)} w tym miesiącu.` });
    }

    // Compare to last month
    const now = new Date();
    const lastMonthAll = Transactions.getAll().filter(t => {
      const d = new Date(t.date);
      const lm = new Date(now.getFullYear(), now.getMonth()-1, 1);
      return d.getFullYear() === lm.getFullYear() && d.getMonth() === lm.getMonth();
    });
    if (lastMonthAll.length) {
      const lastS = Transactions.calcSummary(lastMonthAll.filter(t=>t.type==='expense'));
      if (summary.expense < lastS.expense && lastS.expense > 0) {
        const diff = lastS.expense - summary.expense;
        insights.push({ icon: '📉', text: `W tym miesiącu wydałeś o <strong>${formatCurrency(diff, settings.currency)} mniej</strong> niż w poprzednim. Dobra robota!` });
      } else if (summary.expense > lastS.expense && lastS.expense > 0) {
        const diff = summary.expense - lastS.expense;
        insights.push({ icon: '📈', text: `Wydałeś o <strong>${formatCurrency(diff, settings.currency)} więcej</strong> niż w poprzednim miesiącu.` });
      }
    }

    // Weekend spending
    const weekendExp = expenses.filter(t => { const d = new Date(t.date); return d.getDay() === 0 || d.getDay() === 6; });
    const weekdayExp = expenses.filter(t => { const d = new Date(t.date); return d.getDay() > 0 && d.getDay() < 6; });
    if (weekendExp.length > 0 && weekdayExp.length > 0) {
      const wkndAvg = weekendExp.reduce((s,t)=>s+t.amount,0) / weekendExp.length;
      const wkdayAvg = weekdayExp.reduce((s,t)=>s+t.amount,0) / weekdayExp.length;
      if (wkndAvg > wkdayAvg * 1.5) {
        insights.push({ icon: '📅', text: `Wydajesz średnio <strong>więcej w weekendy</strong> niż w dni robocze. Planuj z wyprzedzeniem!` });
      }
    }

    // Average daily expense
    if (expenses.length) {
      const totalExp = expenses.reduce((s,t)=>s+t.amount,0);
      const days = new Set(expenses.map(t=>t.date)).size;
      const avg = totalExp / Math.max(days, 1);
      insights.push({ icon: '📊', text: `Średni dzienny wydatek wynosi <strong>${formatCurrency(avg, settings.currency)}</strong>.` });
    }

    // Subscriptions warning
    const subs = expenses.filter(t => t.categoryId === 'subs');
    if (subs.length) {
      const subTotal = subs.reduce((s,t)=>s+t.amount,0);
      const pct = summary.expense > 0 ? Math.round((subTotal/summary.expense)*100) : 0;
      if (pct > 20) {
        insights.push({ icon: '📱', text: `Abonamenty stanowią <strong>${pct}%</strong> Twoich wydatków. Czy wszystkie są potrzebne?` });
      }
    }

    // Savings rate
    if (summary.income > 0) {
      const savingsRate = Math.round(((summary.income - summary.expense) / summary.income) * 100);
      if (savingsRate > 20) {
        insights.push({ icon: '💰', text: `Oszczędzasz <strong>${savingsRate}%</strong> swoich przychodów. Świetny wynik!` });
      } else if (savingsRate < 0) {
        insights.push({ icon: '⚠️', text: `Twoje wydatki przekraczają przychody o <strong>${formatCurrency(Math.abs(summary.balance), settings.currency)}</strong>.` });
      }
    }

    if (!insights.length) {
      insights.push({ icon: '✅', text: 'Twoje finanse wyglądają stabilnie. Dodaj więcej transakcji, aby zobaczyć więcej analiz.' });
    }

    container.innerHTML = insights.slice(0, 4).map(i =>
      `<div class="insight-card"><span class="insight-icon">${i.icon}</span><span class="insight-text">${i.text}</span></div>`
    ).join('');
  };

  return { render };
})();
