/* ============================================
   CashFlow v0.1.0 — Smart Insights Module (no AI)
   ============================================ */

const Insights = (() => {
  const generate = () => {
    const cur   = Settings.get('currency');
    const now   = DateUtil.currentMonthKey();
    const prev  = DateUtil.prevMonthKey(now);
    const allTx = Transactions.getAll();
    const thisMonth = allTx.filter(t => DateUtil.getMonthKey(t.date) === now);
    const prevMonth = allTx.filter(t => DateUtil.getMonthKey(t.date) === prev);

    const expense  = thisMonth.filter(t => t.type === 'expense');
    const income   = thisMonth.filter(t => t.type === 'income');
    const insights = [];

    // 1. Top category
    if (expense.length) {
      const byCat = {};
      expense.forEach(t => { byCat[t.category] = (byCat[t.category] || 0) + t.amount; });
      const topCat = Object.entries(byCat).sort((a,b) => b[1]-a[1])[0];
      if (topCat) {
        const cat = Categories.getById(topCat[0]);
        insights.push({
          emoji: cat.emoji,
          text: `Najwięcej wydajesz na <strong>${cat.name}</strong> — ${Format.number(topCat[1])} ${cur} w tym miesiącu.`
        });
      }
    }

    // 2. Compare to last month
    const thisExp  = expense.reduce((s,t) => s + t.amount, 0);
    const prevExp  = prevMonth.filter(t => t.type === 'expense').reduce((s,t) => s + t.amount, 0);
    if (prevExp > 0 && thisExp > 0) {
      const diff = thisExp - prevExp;
      const pct  = Math.abs(Math.round((diff / prevExp) * 100));
      if (diff < 0) {
        insights.push({ emoji: '📉', text: `W tym miesiącu wydałeś <strong>${pct}% mniej</strong> niż w poprzednim. Świetnie!` });
      } else if (diff > 0) {
        insights.push({ emoji: '📈', text: `W tym miesiącu wydałeś <strong>${pct}% więcej</strong> niż w poprzednim.` });
      }
    }

    // 3. Weekend spending
    const weekendExp = expense.filter(t => DateUtil.isWeekend(t.date)).reduce((s,t) => s+t.amount, 0);
    const totalExp   = expense.reduce((s,t) => s+t.amount, 0);
    if (weekendExp > 0 && totalExp > 0) {
      const weekendPct = Math.round((weekendExp / totalExp) * 100);
      if (weekendPct > 40) {
        insights.push({ emoji: '🎉', text: `<strong>${weekendPct}% wydatków</strong> ponosisz w weekendy.` });
      }
    }

    // 4. Average daily expense
    if (expense.length) {
      const dates = [...new Set(expense.map(t => t.date))].length;
      const avgDaily = totalExp / (dates || 1);
      insights.push({ emoji: '📊', text: `Średni wydatek dzienny wynosi <strong>${Format.number(avgDaily)} ${cur}</strong>.` });
    }

    // 5. Subscriptions share
    const subExp = expense.filter(t => t.category === 'subs').reduce((s,t) => s+t.amount, 0);
    if (subExp > 0 && totalExp > 0) {
      const subPct = Math.round((subExp / totalExp) * 100);
      if (subPct > 15) {
        insights.push({ emoji: '📱', text: `Abonamenty stanowią <strong>${subPct}%</strong> Twoich wydatków w tym miesiącu.` });
      }
    }

    // 6. Savings rate
    const totalIncome = income.reduce((s,t) => s+t.amount, 0);
    if (totalIncome > 0 && totalExp > 0) {
      const savingsRate = Math.round(((totalIncome - totalExp) / totalIncome) * 100);
      if (savingsRate > 0) {
        insights.push({ emoji: '💰', text: `Oszczędzasz <strong>${savingsRate}%</strong> swoich przychodów — ${Format.number(totalIncome - totalExp)} ${cur}.` });
      } else {
        insights.push({ emoji: '⚠️', text: `Wydatki przekraczają przychody o <strong>${Format.number(Math.abs(totalIncome - totalExp))} ${cur}</strong>.` });
      }
    }

    // 7. Biggest single expense
    if (expense.length) {
      const biggest = expense.reduce((max, t) => t.amount > max.amount ? t : max, expense[0]);
      const cat = Categories.getById(biggest.category);
      insights.push({ emoji: '🔍', text: `Największy pojedynczy wydatek: <strong>${Format.number(biggest.amount)} ${cur}</strong> (${cat.emoji} ${biggest.desc || cat.name}).` });
    }

    return insights.slice(0, 5);
  };

  const render = () => {
    const container = document.getElementById('insights-list');
    if (!container) return;

    const insights = generate();
    if (!insights.length) {
      container.innerHTML = `<div class="insight-empty">Dodaj transakcje, aby zobaczyć analizy.</div>`;
      return;
    }

    container.innerHTML = insights.map(ins => `
      <div class="insight-item">
        <span class="insight-emoji">${ins.emoji}</span>
        <span class="insight-text">${ins.text}</span>
      </div>
    `).join('');
  };

  return { generate, render };
})();
