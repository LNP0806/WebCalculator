(function(){
      // Calculator state
      let expression = []; // tokens: numbers (as strings) and operators
      let current = '0';
      let memory = 0;
      let overwrite = false; // next digit will overwrite current

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

      /*
        pushOperator(op)
        - Nếu vừa bấm "=" (overwrite === true và expression chứa 1 chuỗi "… =") -> bắt đầu biểu thức mới từ current
        - Nếu đã có [left, op] và user đã nhập current (right) -> tính trung gian, chuyển kết quả thành left, rồi thêm toán tử mới
        - Nếu chưa có left -> đẩy current làm left rồi thêm toán tử
        - Nếu phần tử cuối là toán tử và user bấm toán tử -> thay toán tử đó (không tạo 2 toán tử)
      */
      function pushOperator(op) {
        // Trường hợp vừa bấm "=": bắt đầu lại từ kết quả hiện tại
        if (overwrite && expression.length && String(expression[0]).includes('=')) {
          // expression[0] là dạng "a + b ="
          // bắt đầu biểu thức mới từ current (kết quả), bỏ dấu '='
          expression = [current];
          overwrite = false;
        }

        // Nếu biểu thức có dạng [left, op] và đang có current (right) -> tính ngay
        if (expression.length === 2 && current !== null) {
          // tính left op current
          const tokens = [expression[0], expression[1], current];
          try {
            const r = evaluateTokens(tokens);
            current = formatNumber(r);
            // đặt kết quả làm toán hạng trái cho biểu thức mới
            expression = [current];
          } catch (e) {
            ccurrent = e.message || "Math Error";
            expression = [];
            overwrite = true;
            updateScreen();
            return;
          }
        } else if (expression.length === 0 && current !== null) {
          // chưa có gì: đẩy current làm toán hạng trái
          expression.push(current);
        }

        // Thêm hoặc thay toán tử: nếu phần tử cuối là toán tử -> thay, ngược lại push
        const last = expression[expression.length - 1];
        if (isOperator(last)) {
          expression[expression.length - 1] = op;
        } else {
          expression.push(op);
        }

        // Sau khi thêm toán tử, chuẩn bị để nhập toán hạng bên phải
        // giữ current như đang hiển thị kết quả/giá trị trước đó,
        // nhưng signal rằng next digit phải bắt đầu số mới
        overwrite = false;
        // mark current as null so inputDigit knows phải khởi tạo toán hạng mới
        current = null;
        justCalculated = false;
        updateScreen();
      }

      /*
        inputDigit(d)
        - Nếu vừa bấm "=" và expression chứa '=' -> bắt đầu phép mới trực tiếp từ chữ số vừa nhấn
        - Nếu trước đó vừa bấm toán tử (expression.last là operator) -> bắt đầu nhập toán hạng mới (không nối vào current cũ)
        - Nếu không thì nối số bình thường
      */
      function inputDigit(d){
        // Nếu vừa bấm "=" và biểu thức trên chứa '=' -> bắt đầu new expression
        if (overwrite && expression.length && String(expression[0]).includes('=')) {
          expression = [];
          // bắt đầu current bằng chữ số vừa bấm
          current = (d === '.') ? '0.' : d;
          overwrite = false;
          updateScreen();
          return;
        }

        // Nếu trước đó vừa bấm 1 toán tử (expression.last là operator) -> bắt đầu toán hạng mới
        if (expression.length && isOperator(expression[expression.length - 1]) && (current === null || overwrite)) {
          current = (d === '.') ? '0.' : d;
          overwrite = false;
          updateScreen();
          return;
        }

        // Bình thường: nếu overwrite true (ví dụ sau 1 unary op) thì ghi đè, ngược lại nối
        if (overwrite || current === null) {
          current = (d === '.') ? '0.' : d;
          overwrite = false;
        } else {
          if (d === '.' && current.includes('.')) return; // ngăn nhập 2 dấu chấm
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

      // Gắn vào window để test.html có thể gọi được
      window.calculator = {
        add,
        subtract,
        multiply,
        divide,
        square,
        reciprocal,
        sqrt
      };


      function doEquals() {
        // Nếu vừa tính xong mà lại bấm "=" lần nữa → bỏ qua
        if (justCalculated) return;

        // build tokens
        let tokens = expression.slice();
        if (current !== null) tokens.push(current);
        if (tokens.length === 0) return;

        try {
          const result = evaluateTokens(tokens);
          const exprStr = tokens.join(' ')
            .replace(/\*/g, '×')
            .replace(/\//g, '÷');
          current = formatNumber(result);
          expression = [exprStr + ' =']; // hiển thị biểu thức đã tính
          justCalculated = true; // ✅ đánh dấu đã tính xong
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

        // Làm tròn đến 12 chữ số hợp lý
        r = Number(r.toPrecision(10));

        // Nếu là số nguyên, bỏ phần thập phân
        if (Number.isInteger(r)) {
          current = String(r);
        } else {
          // Nếu có phần thập phân, cắt bớt số 0 dư ở cuối
          current = r.toString().replace(/\.?0+$/, '');
        }
      }

      overwrite = true;
      updateScreen();
    }


      function formatNumber(n){
        if (!isFinite(n)) return "Math Error";
        // remove trailing zeros
        let s = String(Number(n.toPrecision(10)));
        return s;
      }

      // Evaluate using shunting-yard -> RPN eval
      function evaluateTokens(tokens){
        // Convert percent tokens (we represent percent by setting numbers when percent pressed)
        // tokens are like ["50","+","10"] with the percent having modified current when user pressed %
        // We'll implement percent behavior: if last token was number and previous operator is + or - then treat b% as (a * b /100)
        // To handle that, we must scan tokens and transform where needed.

        // First, transform numeric strings to numbers
        let t2 = tokens.slice();
        // Apply percent when token has trailing % marker? We'll instead assume percent button changed the number already.

        // Shunting-yard
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
          // ignore unknown
        }
        while(ops.length) output.push(ops.pop());
        // Evaluate RPN
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

      // Special actions
      function doClearEntry(){ current = '0'; overwrite = true; updateScreen(); }
      function doClearAll(){ current = '0'; expression = []; overwrite = true; updateScreen(); }
      function doBackspace(){ if(overwrite || current === null){ current = '0'; } else { current = current.slice(0,-1) || '0'; } updateScreen(); }
      function doNegate(){ if(current===null) current='0'; if(current==='0') return; if(current.startsWith('-')) current = current.slice(1); else current = '-' + current; updateScreen(); }

      function doPercent() {
        let currVal = Number(current || 0);
        currVal = currVal / 100; // chỉ chia cho 100, không nhân với left
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

      // memory operations
      function memClear(){ memory = 0; updateScreen(); }
      function memRecall(){ current = String(memory); overwrite = true; updateScreen(); }
      function memAdd(){ memory += Number(current || 0); updateScreen(); }
      function memSubtract(){ memory -= Number(current || 0); updateScreen(); }

      // button handler
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

      // keyboard support
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

      // initialize
      updateScreen();
})();
