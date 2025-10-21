(function(){
      let expression = [];
      let current = '0';
      let memory = 0;
      let overwrite = false;

      const displayEl = document.getElementById('display');
      const exprEl = document.getElementById('expression');
      const memEl = document.getElementById('mem');

      function updateScreen(){
        displayEl.textContent = current;
        exprEl.textContent = expression.join(' ') || '0';
        memEl.textContent = memory !== 0 ? 'M' : '';
      }

      let justCalculated = false;

      function isOperator(t){
        return t === '+' || t === '-' || t === '*' || t === '/';
      }

      function pushOperator(op) {
        if (overwrite && expression.length && String(expression[0]).includes('=')) {
          expression = [current];
          overwrite = false;
        }

        if (expression.length === 2 && current !== null) {
          const tokens = [expression[0], expression[1], current];
          try {
            const r = evaluateTokens(tokens);
            current = formatNumber(r);
            expression = [current];
          } catch (e) {
            ccurrent = e.message || "Math Error";
            expression = [];
            overwrite = true;
            updateScreen();
            return;
          }
        } else if (expression.length === 0 && current !== null) {
          expression.push(current);
        }

        const last = expression[expression.length - 1];
        if (isOperator(last)) {
          expression[expression.length - 1] = op;
        } else {
          expression.push(op);
        }

        overwrite = false;
        current = null;
        justCalculated = false;
        updateScreen();
      }

      function inputDigit(d){
        if (overwrite && expression.length && String(expression[0]).includes('=')) {
          expression = [];
          current = (d === '.') ? '0.' : d;
          overwrite = false;
          updateScreen();
          return;
        }

        if (expression.length && isOperator(expression[expression.length - 1]) && (current === null || overwrite)) {
          current = (d === '.') ? '0.' : d;
          overwrite = false;
          updateScreen();
          return;
        }

        if (overwrite || current === null) {
          current = (d === '.') ? '0.' : d;
          overwrite = false;
        } else {
          if (d === '.' && current.includes('.')) return;
          current = (current === '0' && d !== '.') ? d : current + d;
        }
        justCalculated = false;
        updateScreen();
      }

      function add(a, b) {
        return a + b;
      }

      function subtract(a, b) {
        return a - b;
      }

      function multiply(a, b) {
        return a * b;
      }

      function divide(a, b) {
        if (b === 0) throw new Error("Divide by 0");
        return a / b;
      }

      function square(a) {
        return a * a;
      }

      function reciprocal(a) {
        return 1 / a;
      }

      function sqrt(a) {
        return Math.sqrt(a);
      }

      function doEquals() {
        if (justCalculated) return;

        let tokens = expression.slice();
        if (current !== null) tokens.push(current);
        if (tokens.length === 0) return;

        try {
          const result = evaluateTokens(tokens);
          const exprStr = tokens.join(' ')
            .replace(/\*/g, '×')
            .replace(/\//g, '÷');
          current = formatNumber(result);
          expression = [exprStr + ' ='];
          justCalculated = true;
        } catch (e) {
          current = e.message || "Math Error";
          expression = [];
          justCalculated = true;
        }

        overwrite = true;
        updateScreen();
      }

      function doSquare(){
        const v = Number(current || 0);
        current = String(square(v));
        overwrite = true;
        updateScreen();
      }

      function doReciprocal() {
      const v = Number(current || 0);
      if (v === 0) {
        current = 'Divide by 0';
      } else {
        let r = reciprocal(v);

        r = Number(r.toPrecision(10));

        if (Number.isInteger(r)) {
          current = String(r);
        } else {
          current = r.toString().replace(/\.?0+$/, '');
        }
      }

      overwrite = true;
      updateScreen();
    }

      function formatNumber(n){
        if (!isFinite(n)) return "Math Error";
        let s = String(Number(n.toPrecision(10)));
        return s;
      }

      function evaluateTokens(tokens){
        let t2 = tokens.slice();

        const prec = {'+':1,'-':1,'*':2,'/':2};
        let output = [];
        let ops = [];
        for(let i=0;i<t2.length;i++){
          const tok = t2[i];
          if(!isNaN(tok)){
            output.push(Number(tok));
            continue;
          }
          if(isOperator(tok)){
            while(ops.length && isOperator(ops[ops.length-1]) && prec[ops[ops.length-1]] >= prec[tok]){
              output.push(ops.pop());
            }
            ops.push(tok);
            continue;
          }
        }
        while(ops.length) output.push(ops.pop());
        let st = [];
        for(let item of output){
          if(typeof item === 'number') st.push(item);
          else {
            const b = st.pop();
            const a = st.pop();
            let r = 0;
            try {
              switch(item){
                case '+': r = add(a, b); break;
                case '-': r = subtract(a, b); break;
                case '*': r = multiply(a, b); break;
                case '/': r = divide(a, b); break;
              }
              if (!isFinite(r)) throw new Error("Math Error");
              r = Number(r.toPrecision(10));
              st.push(r);
            } catch (err) {
              throw err;
            }
          }
        }
        return st[0];
      }

      function doClearEntry(){ current = '0'; overwrite = true; updateScreen(); }
      function doClearAll(){ current = '0'; expression = []; overwrite = true; updateScreen(); }
      function doBackspace(){ if(overwrite || current === null){ current = '0'; } else { current = current.slice(0,-1) || '0'; } updateScreen(); }
      function doNegate(){ if(current===null) current='0'; if(current==='0') return; if(current.startsWith('-')) current = current.slice(1); else current = '-' + current; updateScreen(); }

      function doPercent() {
        let currVal = Number(current || 0);
        currVal = currVal / 100;
        current = String(currVal);
        overwrite = true;
        updateScreen();
      }

      function doSqrt(){
        const v = Number(current || 0);
        if(v < 0) { current = 'Invalid input'; }
        else current = String(sqrt(v));
        overwrite = true; updateScreen();
      }

      function memClear(){ memory = 0; updateScreen(); }
      function memRecall(){ current = String(memory); overwrite = true; updateScreen(); }
      function memAdd(){ memory += Number(current || 0); updateScreen(); }
      function memSubtract(){ memory -= Number(current || 0); updateScreen(); }

      document.getElementById('keys').addEventListener('click', (e)=>{
        const btn = e.target.closest('button'); if(!btn) return;
        const num = btn.getAttribute('data-num');
        const action = btn.getAttribute('data-action');
        if(num !== null){ inputDigit(num); return; }
        switch(action){
          case 'dot': inputDigit('.'); break;
          case 'add': pushOperator('+'); break;
          case 'subtract': pushOperator('-'); break;
          case 'multiply': pushOperator('*'); break;
          case 'divide': pushOperator('/'); break;
          case 'equals': doEquals(); break;
          case 'clearEntry': doClearEntry(); break;
          case 'clear': doClearAll(); break;
          case 'back': doBackspace(); break;
          case 'negate': doNegate(); break;
          case 'percent': doPercent(); break;
          case 'sqrt': doSqrt(); break;
          case 'mc': memClear(); break;
          case 'mr': memRecall(); break;
          case 'mplus': memAdd(); break;
          case 'mminus': memSubtract(); break;
          case 'square': doSquare(); break;
          case 'reciprocal': doReciprocal(); break;
        }
      });

      window.addEventListener('keydown', (e)=>{
        if(e.key >= '0' && e.key <= '9'){ inputDigit(e.key); e.preventDefault(); return; }
        if(e.key === '.' || e.key === ','){ inputDigit('.'); e.preventDefault(); return; }
        if(e.key === '+'){ pushOperator('+'); e.preventDefault(); return; }
        if(e.key === '-') { pushOperator('-'); e.preventDefault(); return; }
        if(e.key === '*' || e.key === 'x') { pushOperator('*'); e.preventDefault(); return; }
        if(e.key === '/') { pushOperator('/'); e.preventDefault(); return; }
        if(e.key === 'Enter' || e.key === '=') { doEquals(); e.preventDefault(); return; }
        if(e.key === 'Backspace') { doBackspace(); e.preventDefault(); return; }
        if(e.key === 'Escape') { doClearAll(); e.preventDefault(); return; }
        if(e.key === '%') { doPercent(); e.preventDefault(); return; }
      });

      updateScreen();
})();
