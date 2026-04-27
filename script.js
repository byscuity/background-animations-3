(function() {
    // Configurações do Canvas
    const canvas = document.getElementById('canvas-squares');
    let ctx = canvas.getContext('2d');
    
    // Array que armazenará os quadrados ativos
    let squares = [];
    
    // Configurações de spawn - MENOS QUADRADOS
    let spawnCounter = 0;
    const SPAWN_INTERVAL_FRAMES = 30;   // Spawn mais lento e controlado
    const MAX_SQUARES = 25;              // REDUZIDO: máximo 25 quadrados
    
    // Tamanho variável dos quadrados
    const MIN_SIZE = 8;
    const MAX_SIZE = 30;
    
    // Velocidade de subida - MAIS RÁPIDA e suave
    const BASE_SPEED = 130;              // Velocidade rápida
    const SPEED_VARIATION = 40;          // Variação para dar dinamismo
    
    // Duração do fade-out
    const BASE_LIFE = 1.5;               // 1.5 segundos para desaparecer
    const LIFE_VARIATION = 0.5;          // Variação pequena
    
    // Rotação
    const MIN_ROT_SPEED = -2;
    const MAX_ROT_SPEED = 2;
    
    // Cores - tons suaves de branco e cinza
    const COLORS = [
        'rgba(255, 255, 255, 0.9)',
        'rgba(240, 240, 240, 0.85)',
        'rgba(220, 220, 220, 0.8)',
        'rgba(200, 200, 200, 0.75)',
        'rgba(245, 245, 245, 0.85)',
        'rgba(235, 235, 235, 0.8)'
    ];
    
    // Ajustar canvas ao tamanho da tela
    function resizeCanvas() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    }
    
    // Gerar número aleatório
    function randomRange(min, max) {
        return min + Math.random() * (max - min);
    }
    
    // Selecionar cor aleatória
    function getRandomColor() {
        return COLORS[Math.floor(Math.random() * COLORS.length)];
    }
    
    // Classe Quadrado otimizada
    class Square {
        constructor(x, y, size, speedY, lifeDuration, rotationSpeed, color) {
            this.x = x;
            this.y = y;
            this.size = size;
            this.speedY = speedY;
            this.rotation = randomRange(0, Math.PI * 2);
            this.rotationSpeed = rotationSpeed;
            this.lifeDuration = lifeDuration;
            this.age = 0;
            this.color = color;
        }
        
        update(dt) {
            this.y += this.speedY * dt;
            this.rotation += this.rotationSpeed * dt;
            this.age += dt;
            return this.age < this.lifeDuration;
        }
        
        draw(ctx) {
            // Cálculo do fade gradiente
            let lifeProgress = this.age / this.lifeDuration;
            let alpha = Math.pow(1 - lifeProgress, 1.3); // Curva de fade suave
            
            if (alpha <= 0.02) return;
            
            ctx.save();
            ctx.translate(this.x + this.size/2, this.y + this.size/2);
            ctx.rotate(this.rotation);
            
            // Extrair cor RGB e aplicar alpha dinâmico
            let rgbMatch = this.color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/i);
            if (rgbMatch) {
                let r = rgbMatch[1];
                let g = rgbMatch[2];
                let b = rgbMatch[3];
                ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${alpha})`;
            } else {
                ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
            }
            
            ctx.fillRect(-this.size/2, -this.size/2, this.size, this.size);
            ctx.restore();
        }
    }
    
    // Criar novo quadrado - APENAS na parte inferior
    function createSquare(canvasWidth, canvasHeight) {
        // Posição X aleatória com margem
        const margin = 15;
        const x = randomRange(margin, canvasWidth - margin);
        
        // Posição Y: estritamente na borda inferior
        const y = canvasHeight - randomRange(0, 10);
        
        // Propriedades aleatórias
        const size = randomRange(MIN_SIZE, MAX_SIZE);
        const speedY = -(BASE_SPEED + randomRange(-SPEED_VARIATION/2, SPEED_VARIATION));
        const lifeDuration = randomRange(BASE_LIFE - LIFE_VARIATION/2, BASE_LIFE + LIFE_VARIATION/2);
        const rotationSpeed = randomRange(MIN_ROT_SPEED, MAX_ROT_SPEED);
        const color = getRandomColor();
        
        return new Square(x, y, size, speedY, lifeDuration, rotationSpeed, color);
    }
    
    // Inicialização
    function init() {
        resizeCanvas();
        // Adicionar apenas 5 quadrados iniciais
        for (let i = 0; i < 5; i++) {
            let newSquare = createSquare(canvas.width, canvas.height);
            newSquare.age = Math.random() * newSquare.lifeDuration * 0.4;
            squares.push(newSquare);
        }
    }
    
    let lastFrameTime = performance.now();
    let frameCount = 0;
    
    // Loop principal de animação
    function animate(now) {
        let dt = Math.min(0.033, (now - lastFrameTime) / 1000);
        if (dt <= 0) {
            lastFrameTime = now;
            requestAnimationFrame(animate);
            return;
        }
        
        // Atualizar quadrados
        for (let i = squares.length - 1; i >= 0; i--) {
            const square = squares[i];
            const isAlive = square.update(dt);
            if (!isAlive) {
                squares.splice(i, 1);
            }
        }
        
        // Controle de spawn otimizado
        frameCount++;
        if (frameCount >= SPAWN_INTERVAL_FRAMES && squares.length < MAX_SQUARES) {
            frameCount = 0;
            
            // Adicionar 1 quadrado por vez (mais controlado)
            if (squares.length < MAX_SQUARES) {
                let newSquare = createSquare(canvas.width, canvas.height);
                squares.push(newSquare);
            }
            
            // Ocasionalmente adicionar um segundo quadrado (30% de chance)
            if (squares.length < MAX_SQUARES && Math.random() < 0.3) {
                let newSquare = createSquare(canvas.width, canvas.height);
                squares.push(newSquare);
            }
        }
        
        // Limpar canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Desenhar todos os quadrados
        for (let square of squares) {
            square.draw(ctx);
        }
        
        lastFrameTime = now;
        requestAnimationFrame(animate);
    }
    
    // Evento de resize com debounce para melhor performance
    let resizeTimeout;
    window.addEventListener('resize', function() {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(() => {
            resizeCanvas();
            // Reposicionar quadrados que ficaram fora dos limites
            for (let sq of squares) {
                if (sq.x < 0) sq.x = 10;
                if (sq.x + sq.size > canvas.width) sq.x = canvas.width - sq.size - 10;
                if (sq.y > canvas.height) sq.y = canvas.height - 10;
            }
        }, 100);
    });
    
    // Iniciar animação
    init();
    lastFrameTime = performance.now();
    requestAnimationFrame(animate);
    
})();
