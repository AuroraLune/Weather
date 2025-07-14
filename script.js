
document.addEventListener('DOMContentLoaded', function() {
    const apiKey = '7f93be964af2f8ab910b5685d4cdcbda'; // Thay bằng API key của bạn
    let currentUnit = 'celsius';
    let currentTemperature = 0;
    let currentWindSpeed = 0; 
    
    // Các phần tử DOM
    const searchInput = document.getElementById('search-input');
    const searchBtn = document.getElementById('search-btn');
    const unitBtns = document.querySelectorAll('.unit-btn');
    const cityName = document.getElementById('city-name');
    const currentTemp = document.getElementById('current-temp');
    const currentIcon = document.getElementById('current-icon');
    const weatherDesc = document.getElementById('weather-desc');
    const humidity = document.getElementById('humidity');
    const wind = document.getElementById('wind');
    const pressure = document.getElementById('pressure');
    const visibility = document.getElementById('visibility');
    const forecastContainer = document.getElementById('forecast-container');
    const weatherEffect = document.getElementById('weather-effect');
    const body = document.body;
    
    // Mảng lịch sử tìm kiếm
    let searchHistory = JSON.parse(localStorage.getItem('weatherSearchHistory')) || [];
    
    // Khởi tạo ứng dụng
    initApp();
    
    // Sự kiện tìm kiếm
    searchBtn.addEventListener('click', searchWeather);
    searchInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') searchWeather();
    });
    
    // Sự kiện chuyển đổi đơn vị
    unitBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            unitBtns.forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            currentUnit = this.dataset.unit;
            updateWeatherUnit();
        });
    });
    
    // Hàm khởi tạo
    function initApp() {
        // Thử lấy vị trí hiện tại trước
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                position => {
                    const { latitude, longitude } = position.coords;
                    fetchWeatherByCoords(latitude, longitude);
                },
                error => {
                    console.error("Geolocation error:", error);
                    // Mặc định hiển thị thời tiết Hà Nội nếu không lấy được vị trí
                    fetchWeather('Hanoi');
                }
            );
        } else {
            fetchWeather('Hanoi');
        }
        
        // Tạo autocomplete cho ô tìm kiếm
        setupAutocomplete() 
    }
    
    // Hàm tìm kiếm thời tiết
    function searchWeather() {
        const city = searchInput.value.trim();
        if (city) {
            // Reset về °C mỗi khi tìm kiếm mới
            currentUnit = 'celsius';
            unitBtns.forEach(btn => {
                btn.classList.toggle('active', btn.dataset.unit === 'celsius');
            });
        
            fetchWeather(city);
            
            // Lưu vào lịch sử
            if (!searchHistory.includes(city)) {
                searchHistory.unshift(city);
                if (searchHistory.length > 5) searchHistory.pop();
                localStorage.setItem('weatherSearchHistory', JSON.stringify(searchHistory));
            }

            //resetSearch(); 
        }
    }
    
    // Hàm fetch thời tiết theo thành phố
    async function fetchWeather(city) {
        try {
            const response = await fetch(
                `https://api.openweathermap.org/data/2.5/weather?q=${city}&units=metric&appid=${apiKey}&lang=vi`
            );
            const data = await response.json();
            
            if (data.cod === 200) {
                updateCurrentWeather(data);
                fetchForecast(data.coord.lat, data.coord.lon);
            } else {
                alert('Không tìm thấy thành phố. Vui lòng thử lại.');
            }
        } catch (error) {
            console.error('Error fetching weather:', error);
            alert('Có lỗi xảy ra khi tải dữ liệu thời tiết.');
        }
    }
    
    // Hàm fetch thời tiết theo tọa độ
    async function fetchWeatherByCoords(lat, lon) {
        try {
            const response = await fetch(
                `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=metric&appid=${apiKey}&lang=vi`
            );
            const data = await response.json();
            updateCurrentWeather(data);
            fetchForecast(lat, lon);
        } catch (error) {
            console.error('Error fetching weather by coords:', error);
        }
    }
    
    // Hàm fetch dự báo 5 ngày tới
    async function fetchForecast(lat, lon) {
        try {
            const response = await fetch(
                `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&units=metric&appid=${apiKey}&lang=vi`
            );
            const data = await response.json();
            updateForecast(data);
        } catch (error) {
            console.error('Error fetching forecast:', error);
        }
    }
    
    // Cập nhật thời tiết hiện tại
    function updateCurrentWeather(data) {
        cityName.textContent = data.name;
        //currentTemperature = data.main.temp; // Lưu giá trị gốc để chuyển đổi sau
        currentTemp.textContent = `${Math.round(data.main.temp)}°C`;
        weatherDesc.textContent = data.weather[0].description;
        humidity.textContent = `${data.main.humidity}%`;
        //currentWindSpeed = data.wind.speed; // Lưu giá trị gốc để chuyển đổi sau
        wind.textContent = `${Math.round(data.wind.speed * 3.6)} km/h`; // m/s -> km/h
        pressure.textContent = `${data.main.pressure} hPa`;
        visibility.textContent = `${(data.visibility / 1000).toFixed(1)} km`; // m -> km
        
        const iconCode = data.weather[0].icon;
        currentIcon.src = `https://openweathermap.org/img/wn/${iconCode}@2x.png`;
        currentIcon.alt = data.weather[0].main;
        
        // Cập nhật theme và hiệu ứng theo thời tiết
        updateWeatherTheme(data.weather[0].main, data.weather[0].icon.includes('n'));
    }
    
    // Cập nhật dự báo 5 ngày
    function updateForecast(data) {
        forecastContainer.innerHTML = '';
        
        // Lọc dữ liệu để lấy 1 mốc mỗi ngày (12:00 trưa)
        const dailyForecasts = data.list.filter(item => {
            return item.dt_txt.includes('12:00:00');
        }).slice(0, 5); // Lấy 5 ngày
        
        dailyForecasts.forEach(day => {
            const date = new Date(day.dt * 1000);
            const dayName = date.toLocaleDateString('vi-VN', { weekday: 'short' });
            
            const forecastCard = document.createElement('div');
            forecastCard.className = 'forecast-card';
            forecastCard.innerHTML = `
                <div class="forecast-day">${dayName}</div>
                <img class="forecast-icon" src="https://openweathermap.org/img/wn/${day.weather[0].icon}@2x.png" alt="${day.weather[0].main}">
                <div>${Math.round(day.main.temp)}°C</div>
                <div style="font-size: 0.8em;">${day.weather[0].description}</div>
            `;
            
            forecastContainer.appendChild(forecastCard);
        });
    }
    
    // Cập nhật đơn vị nhiệt độ
    function updateWeatherUnit() {
        const currentTempValue = parseInt(currentTemp.textContent);
        
        if (currentUnit === 'fahrenheit') {
            // Chuyển từ °C sang °F
            const fahrenheit = Math.round((currentTempValue * 9/5) + 32);
            currentTemp.textContent = `${fahrenheit}°F`;
            
            // Cập nhật tốc độ gió từ km/h sang mph
            const windValue = parseFloat(wind.textContent.split(' ')[0]);
            wind.textContent = `${Math.round(windValue * 0.621371)} mph`;
        } 
        else {
            // Chuyển từ °F về °C
            const celsius = Math.round((currentTempValue - 32) * 5/9);
            currentTemp.textContent = `${celsius}°C`;
            
            // Cập nhật tốc độ gió từ mph về km/h
            const windValue = parseFloat(wind.textContent.split(' ')[0]);
            wind.textContent = `${Math.round(windValue / 0.621371)} km/h`;
        }
        
    }
    
    // Cập nhật theme và hiệu ứng theo thời tiết
    function updateWeatherTheme(weatherCondition, isNight) {
        // Xóa tất cả các lớp hiệu ứng cũ
        weatherEffect.innerHTML = '';
        body.className = '';
        
        // Thêm lớp theo điều kiện thời tiết
        body.classList.add(weatherCondition.toLowerCase());
        if (isNight) body.classList.add('night');
        
        // Tạo hiệu ứng thời tiết
        switch(weatherCondition.toLowerCase()) {
            case 'rain':
                createRainEffect();
                break;
            case 'snow':
                createSnowEffect();
                break;
            case 'clouds':
                createCloudEffect();
                break;
            case 'clear':
                if (isNight) {
                    createStarsEffect();
                } else {
                    createSunEffect();
                }
                break;
        }

    }
/*
    function resetSearch() {
        searchInput.value = ''; // Xóa nội dung đã nhập
    }
*/
    // Thêm hàm này vào phần khởi tạo
    function setupAutocomplete() {
        searchInput.addEventListener('input', async function(e) {
            const query = e.target.value.trim();

            if (query.length < 2) {
                const oldContainer = document.querySelector('.autocomplete-container');
                if (oldContainer) oldContainer.remove();
                return;
            }
            try {
                const response = await fetch(
                    `https://api.openweathermap.org/geo/1.0/direct?q=${query}&limit=5&appid=${apiKey}`
                );
                const cities = await response.json();
                
                showAutocompleteResults(cities);
            } catch (error) {
                console.error('Autocomplete error:', error);
            }
        });

        document.addEventListener('click', function(e) {
            const container = document.querySelector('.autocomplete-container');
            if (!container) return;
            
            const clickedInsideSearch = e.target.closest('.search-input');
            const clickedInsideDropdown = e.target.closest('.autocomplete-container');
            
            if (!clickedInsideSearch && !clickedInsideDropdown) {
                container.remove();
            }
        });

    }

    function showAutocompleteResults(cities) {
        console.log('Cities returned:', cities); 
        const container = document.createElement('div');
        container.className = 'autocomplete-container';
        
        cities.forEach(city => {
            const item = document.createElement('div');
            item.className = 'autocomplete-item';
            item.textContent = `${city.name}, ${city.country}`;
            item.addEventListener('click', () => {
                document.getElementById('search-input').value = city.name;

                // Reset về °C khi chọn địa điểm mới
                currentUnit = 'celsius';
                unitBtns.forEach(btn => {
                    btn.classList.toggle('active', btn.dataset.unit === 'celsius');
                });

                fetchWeather(city.name);

                container.remove(); 

                // resetSearch(); 
            });
            container.appendChild(item);
        });
    
        // Xóa kết quả cũ nếu có
        const oldContainer = document.querySelector('.autocomplete-container');
        if (oldContainer) oldContainer.remove();
        
        const searchContainer = document.querySelector('.search-container');
        searchContainer.appendChild(container);
    }

    // Tạo hiệu ứng mưa
    function createRainEffect() {
        for (let i = 0; i < 50; i++) {
            const drop = document.createElement('div');
            drop.className = 'rain-drop';
            drop.style.left = `${Math.random() * 100}%`;
            drop.style.top = `${Math.random() * 100}%`;
            drop.style.animationDuration = `${0.5 + Math.random() * 0.5}s`;
            drop.style.animationDelay = `${Math.random() * 0.5}s`;
            weatherEffect.appendChild(drop);
        }
        
        const style = document.createElement('style');
        style.textContent = `
            .rain-drop {
                position: absolute;
                width: 2px;
                height: 15px;
                background: rgba(255, 255, 255, 0.6);
                animation: rain linear infinite;
            }
            
            @keyframes rain {
                to {
                    transform: translateY(100vh);
                }
            }
        `;
        document.head.appendChild(style);
    }
    
    // Tạo hiệu ứng tuyết 
    function createSnowEffect() {
        for (let i = 0; i < 30; i++) {
            const flake = document.createElement('div');
            flake.className = 'snow-flake';
            flake.style.left = `${Math.random() * 100}%`;
            flake.style.top = `${Math.random() * 100}%`;
            flake.style.opacity = Math.random();
            flake.style.transform = `scale(${Math.random()})`;
            flake.style.animationDuration = `${5 + Math.random() * 10}s`;
            flake.style.animationDelay = `${Math.random() * 5}s`;
            weatherEffect.appendChild(flake);
        }
        
        const style = document.createElement('style');
        style.textContent = `
            .snow-flake {
                position: absolute;
                width: 10px;
                height: 10px;
                background: white;
                border-radius: 50%;
                filter: blur(1px);
                animation: snow linear infinite;
            }
            
            @keyframes snow {
                to {
                    transform: translateY(100vh) rotate(360deg);
                }
            }
        `;
        document.head.appendChild(style);
    }
    
    // Hiệu ứng mây
    function createCloudEffect() {
    for (let i = 0; i < 5; i++) {
        const cloud = document.createElement('div');
        cloud.className = 'cloud';
        cloud.style.left = `${Math.random() * 100}%`;
        cloud.style.top = `${Math.random() * 30}%`;
        cloud.style.opacity = 0.7 + Math.random() * 0.3;
        cloud.style.transform = `scale(${0.5 + Math.random()})`;
        weatherEffect.appendChild(cloud);
    }

    const style = document.createElement('style');
    style.textContent = `
        .cloud {
            position: absolute;
            width: 150px;
            height: 60px;
            background: rgba(255, 255, 255, 0.8);
            border-radius: 50%;
            animation: moveCloud linear infinite;
        }
        
        .cloud:before, .cloud:after {
            content: '';
            position: absolute;
            background: rgba(255, 255, 255, 0.8);
            border-radius: 50%;
        }
        
        .cloud:before {
            width: 80px;
            height: 80px;
            top: -40px;
            left: 20px;
        }
        
        .cloud:after {
            width: 50px;
            height: 50px;
            top: -20px;
            left: 80px;
        }
        
        @keyframes moveCloud {
            from { transform: translateX(-150px); }
            to { transform: translateX(calc(100vw + 150px)); }
        }
    `;
    document.head.appendChild(style);
}
// Hiệu ứng ngôi sao
function createStarsEffect() {
    for (let i = 0; i < 100; i++) {
        const star = document.createElement('div');
        star.className = 'star';
        star.style.left = `${Math.random() * 100}%`;
        star.style.top = `${Math.random() * 100}%`;
        star.style.width = `${Math.random() * 3}px`;
        star.style.height = star.style.width;
        star.style.animationDelay = `${Math.random() * 5}s`;
        weatherEffect.appendChild(star);
    }

    const style = document.createElement('style');
    style.textContent = `
        .star {
            position: absolute;
            background: white;
            border-radius: 50%;
            animation: twinkle 1.5s infinite alternate;
        }
        
        @keyframes twinkle {
            from { opacity: 0.2; }
            to { opacity: 1; }
        }
    `;
    document.head.appendChild(style);
}
// Hiệu ứng mặt trời
function createSunEffect() {
    const sun = document.createElement('div');
    sun.className = 'sun-effect';
    weatherEffect.appendChild(sun);

    const rays = document.createElement('div');
    rays.className = 'sun-rays';
    weatherEffect.appendChild(rays);

    const style = document.createElement('style');
    style.textContent = `
        .sun-effect {
            position: absolute;
            width: 80px;
            height: 80px;
            background: #ffde00;
            border-radius: 50%;
            top: 50px;
            right: 50px;
            box-shadow: 0 0 40px #ffde00;
        }
        
        .sun-rays {
            position: absolute;
            width: 80px;
            height: 80px;
            top: 50px;
            right: 50px;
            background: radial-gradient(circle, rgba(255,222,0,0.8) 0%, rgba(255,222,0,0) 70%);
            border-radius: 50%;
            animation: pulse 2s infinite alternate;
        }
        
        @keyframes pulse {
            from { transform: scale(1); opacity: 0.6; }
            to { transform: scale(1.4); opacity: 0.3; }
        }
    `;
    document.head.appendChild(style);
}

});