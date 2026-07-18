/* ============================================================
   PaidPrime — Kit Interactions
   Reusable behavior for the dividend "receipt" alert card: entrance
   animation + amount count-up, generalized to any number of instances
   (design-system.html hardcoded this to one #receiptDemo element).
   Respects prefers-reduced-motion throughout.
   ============================================================ */
(function () {
  function formatAmount(v) {
    return '+$' + v.toFixed(2);
  }

  function countUp(amountEl, target, reduceMotion) {
    if (reduceMotion) {
      amountEl.textContent = formatAmount(target);
      return;
    }
    var duration = 600;
    var start = null;
    function easeOutCubic(t) { return 1 - Math.pow(1 - t, 3); }
    function step(ts) {
      if (start === null) start = ts;
      var p = Math.min((ts - start) / duration, 1);
      amountEl.textContent = formatAmount(target * easeOutCubic(p));
      if (p < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }

  function playEntrance(receiptEl) {
    var amountEl = receiptEl.querySelector('.amount[data-value]');
    var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    receiptEl.classList.remove('enter');
    void receiptEl.offsetWidth;
    receiptEl.classList.add('enter');
    if (amountEl) countUp(amountEl, parseFloat(amountEl.getAttribute('data-value')), reduceMotion);
  }

  // Any element with [data-receipt] auto-plays its entrance on init.
  // A trigger marked [data-receipt-replay] inside (or immediately after)
  // the receipt replays it on click.
  function initReceipts(root) {
    var scope = root || document;
    var receipts = scope.querySelectorAll('[data-receipt]');
    receipts.forEach(function (el) {
      playEntrance(el);
      var replay = el.querySelector('[data-receipt-replay]');
      if (!replay && el.nextElementSibling && el.nextElementSibling.matches('[data-receipt-replay]')) {
        replay = el.nextElementSibling;
      }
      if (replay) replay.addEventListener('click', function () { playEntrance(el); });
    });
  }

  window.PaidPrimeKit = { initReceipts: initReceipts, playReceiptEntrance: playEntrance };
  document.addEventListener('DOMContentLoaded', function () { initReceipts(document); });
})();
