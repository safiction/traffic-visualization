import * as THREE from 'https://unpkg.com/three@0.160.0/build/three.module.js';

export class PointsAnimator {
    constructor(scene, radius = 2.5) {
        this.scene = scene;
        this.radius = radius;
        this.points = [];
        this.currentIndex = 0;
        this.lastTimestamp = 0;
        this.startTime = null;
        this.packetsCount = 0;
        this.packetsElement = null;
        
        // Создаем элемент для отображения счетчика
        this.createCounterDisplay();
    }
    
    createCounterDisplay() {
        const div = document.createElement('div');
        div.style.position = 'fixed';
        div.style.top = '20px';
        div.style.right = '20px';
        div.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
        div.style.color = 'white';
        div.style.padding = '15px 25px';
        div.style.borderRadius = '10px';
        div.style.fontFamily = 'monospace';
        div.style.fontSize = '18px';
        div.style.zIndex = '1000';
        div.style.border = '1px solid rgba(255,255,255,0.3)';
        div.innerHTML = `
            <div style="margin-bottom: 5px;">📡 Получено пакетов:</div>
            <div style="font-size: 32px; font-weight: bold; text-align: center;">0</div>
        `;
        document.body.appendChild(div);
        this.packetsElement = div;
    }
    
    updateCounter() {
        if (this.packetsElement) {
            const countDiv = this.packetsElement.querySelector('div:last-child');
            countDiv.textContent = this.packetsCount;
            
            // Добавляем анимацию при обновлении
            countDiv.style.transform = 'scale(1.1)';
            setTimeout(() => {
                countDiv.style.transform = 'scale(1)';
            }, 200);
        }
    }
    
    async loadPoints(jsonPath) {
        try {
            const response = await fetch(jsonPath);
            const data = await response.json();
            this.points = data;
            
            // Сортируем по timestamp, если еще не отсортированы
            this.points.sort((a, b) => a[3] - b[3]);
            
            console.log(`Загружено ${this.points.length} точек`);
            
            // Устанавливаем начальное время
            if (this.points.length > 0) {
                this.startTime = performance.now() / 1000;
                this.lastTimestamp = this.points[0][3];
            }
            
            return this.points;
        } catch (error) {
            console.error('Ошибка загрузки точек:', error);
            return [];
        }
    }
    
    convertToSphereCoords(lat, lon, radius) {
        const phi = (90 - lat) * Math.PI / 180;
        const theta = lon * Math.PI / 180;
        
        const x = radius * Math.sin(phi) * Math.cos(theta);
        const y = radius * Math.cos(phi);
        const z = radius * Math.sin(phi) * Math.sin(theta);
        
        return { x, y, z };
    }
    
    addPoint(lat, lon, timestamp, suspicious, ip) {
        const { x, y, z } = this.convertToSphereCoords(lat, lon, this.radius + 0.05);
        
        // Выбираем цвет в зависимости от suspicious флага
        const color = suspicious > 0.5 ? 0xff3333 : 0x33ff33;
        const size = suspicious > 0.5 ? 0.08 : 0.05;
        
        // Создаем сферу для точки
        const geometry = new THREE.SphereGeometry(size, 16, 16);
        const material = new THREE.MeshStandardMaterial({
            color: color,
            emissive: suspicious > 0.5 ? 0x330000 : 0x003300,
            emissiveIntensity: 0.5
        });
        
        const point = new THREE.Mesh(geometry, material);
        point.position.set(x, y, z);
        
        // Добавляем свечение для подозрительных точек
        if (suspicious > 0.5) {
            const glowGeometry = new THREE.SphereGeometry(size * 1.5, 8, 8);
            const glowMaterial = new THREE.MeshBasicMaterial({
                color: 0xff3333,
                transparent: true,
                opacity: 0.3
            });
            const glow = new THREE.Mesh(glowGeometry, glowMaterial);
            point.add(glow);
        }
        
        // Добавляем метку с IP и информацией
        this.addLabel(point, ip, suspicious);
        
        this.scene.add(point);
        
        // Анимация появления
        point.scale.set(0, 0, 0);
        setTimeout(() => {
            this.animatePointAppearance(point);
        }, 100);
        
        return point;
    }
    
    addLabel(point, ip, suspicious) {
        // Создаем canvas для текста
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        canvas.width = 256;
        canvas.height = 128;
        
        context.fillStyle = 'rgba(0, 0, 0, 0.7)';
        context.fillRect(0, 0, canvas.width, canvas.height);
        context.strokeStyle = suspicious > 0.5 ? '#ff3333' : '#33ff33';
        context.strokeRect(0, 0, canvas.width, canvas.height);
        
        context.font = 'Bold 20px Arial';
        context.fillStyle = suspicious > 0.5 ? '#ff8888' : '#88ff88';
        context.fillText(ip, 10, 30);
        
        context.font = '16px Arial';
        context.fillStyle = '#ffffff';
        context.fillText(`Suspicious: ${suspicious}`, 10, 60);
        
        const texture = new THREE.CanvasTexture(canvas);
        const material = new THREE.SpriteMaterial({ map: texture });
        const sprite = new THREE.Sprite(material);
        sprite.scale.set(0.5, 0.25, 0.5);
        sprite.position.set(0.3, 0.2, 0);
        point.add(sprite);
        
        // Скрываем метку по умолчанию, показываем при наведении
        sprite.visible = false;
        point.userData = { sprite, originalScale: point.scale.clone() };
        
        point.addEventListener('mouseover', () => {
            sprite.visible = true;
        });
        
        point.addEventListener('mouseout', () => {
            sprite.visible = false;
        });
    }
    
    animatePointAppearance(point) {
        const duration = 500;
        const startTime = performance.now();
        
        const animate = (currentTime) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(1, elapsed / duration);
            
            // Эффект "вырастания"
            const scale = this.easeOutBack(progress);
            point.scale.set(scale, scale, scale);
            
            if (progress < 1) {
                requestAnimationFrame(animate);
            }
        };
        
        requestAnimationFrame(animate);
    }
    
    easeOutBack(x) {
        const c1 = 1.70158;
        const c3 = c1 + 1;
        return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2);
    }
    
    update(currentTime) {
        if (!this.startTime || this.points.length === 0 || this.currentIndex >= this.points.length) {
            return;
        }
        
        // Вычисляем, сколько времени прошло с начала
        const elapsedSeconds = (performance.now() / 1000) - this.startTime;
        
        // Показываем точки, чье время наступило
        while (this.currentIndex < this.points.length) {
            const pointTime = this.points[this.currentIndex][3];
            const timeDiff = pointTime - this.lastTimestamp;
            
            // Если время точки наступило или прошло
            if (elapsedSeconds >= timeDiff) {
                const point = this.points[this.currentIndex];
                const [ip, lat, lon, timestamp, suspicious] = point;
                
                this.addPoint(lat, lon, timestamp, suspicious, ip);
                this.packetsCount++;
                this.updateCounter();
                
                this.currentIndex++;
                this.lastTimestamp = pointTime;
            } else {
                break;
            }
        }
        
        // Если все точки показаны, выводим сообщение
        if (this.currentIndex >= this.points.length && !this.completed) {
            this.completed = true;
            console.log('Все точки отображены!');
            this.showCompletionMessage();
        }
    }
    
    showCompletionMessage() {
        const message = document.createElement('div');
        message.style.position = 'fixed';
        message.style.bottom = '20px';
        message.style.left = '50%';
        message.style.transform = 'translateX(-50%)';
        message.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
        message.style.color = '#33ff33';
        message.style.padding = '10px 20px';
        message.style.borderRadius = '5px';
        message.style.fontFamily = 'monospace';
        message.style.zIndex = '1000';
        message.innerHTML = '✅ Все пакеты получены!';
        document.body.appendChild(message);
        
        setTimeout(() => {
            message.style.opacity = '0';
            setTimeout(() => message.remove(), 1000);
        }, 3000);
    }
}