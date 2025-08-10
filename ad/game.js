// game.js
// このファイルはゲームのコアロジックを管理します。
export let canvas, ctx;
export let player, gameState, fields, upgradeButtons, workers, workerUpgrade, warehouse, tempStorage, conveyor, fieldUpgrade;
export let cropPrices, crops;
export let sortMethod = 'count';
export let hasAddon = false;

// キーボードとタッチ操作の状態を保持するオブジェクト
const keys = {};
const touch = { x: 0, y: 0, isMoving: false };

/**
 * ゲームの初期化
 * @param {HTMLCanvasElement} gameCanvas - HTMLのcanvas要素
 */
export function initGame(gameCanvas) {
    canvas = gameCanvas;
    ctx = canvas.getContext('2d');

    // 作物の基本価格と購入価格
    cropPrices = {
        '小麦': { sell: 1, buy: 2 },
        'トウモロコシ': { sell: 2, buy: 4 },
        'ニンジン': { sell: 3, buy: 6 },
        'サトウキビ': { sell: 4, buy: 8 },
        '綿': { sell: 5, buy: 10 }
    };
    // ゲーム内で使用される作物の情報
    crops = [
        { name: '小麦', emoji: '🌾', growTime: 1000 },
        { name: 'トウモロコシ', emoji: '🌽', growTime: 2000 },
        { name: 'ニンジン', emoji: '🥕', growTime: 3000 },
        { name: 'サトウキビ', emoji: '🌾', growTime: 4000 },
        { name: '綿', emoji: '🌱', growTime: 5000 }
    ];

    // プレイヤーの初期状態
    player = {
        x: 50,
        y: 50,
        size: 40,
        emoji: '🧑‍🌾',
        speed: 5,
        harvestAbility: 1,
        lastDeliveryLevel: 1,
        lastFarmExpansion: 1
    };

    // ゲームの全体的な状態
    gameState = {
        cash: 0,
        deliveryLevel: 1,
        requiredCrops: {
            '小麦': 3
        },
        message: ''
    };

    // 畑の初期配置
    fields = [
        { x: 200, y: 150, size: 40, crop: null, growTime: 0, plantTime: 0, readyTime: 0, isHarvestable: false, isWithered: false },
        { x: 500, y: 250, size: 40, crop: null, growTime: 0, plantTime: 0, readyTime: 0, isHarvestable: false, isWithered: false },
        { x: 300, y: 400, size: 40, crop: null, growTime: 0, plantTime: 0, readyTime: 0, isHarvestable: false, isWithered: false }
    ];

    // アップグレードボタンの情報
    upgradeButtons = {
        speed: { x: 600, y: 10, width: 180, height: 40, cost: 10, level: 1, text: '移動速度UP' },
        harvest: { x: 600, y: 60, width: 180, height: 40, cost: 20, level: 1, text: '回収能力UP' }
    };

    // お手伝いさん（ワーカー）の情報
    workers = [];
    workerUpgrade = {
        hire: { x: 600, y: 110, width: 180, height: 40, cost: 50, level: 0, text: 'お手伝いさんを雇う' },
        speed: { x: 600, y: 160, width: 180, height: 40, cost: 20, level: 1, text: 'お手伝いさん速度UP' },
        ability: { x: 600, y: 210, width: 180, height: 40, cost: 30, level: 1, text: 'お手伝いさん運搬量UP' }
    };

    // 倉庫の情報
    warehouse = {
        x: 150,
        y: 10,
        width: 100,
        height: 80,
        emoji: '📦',
        capacity: 50,
        storedCrops: {},
        upgrade: { x: 600, y: 260, width: 180, height: 40, cost: 100, level: 1, text: '倉庫容量UP' }
    };
    
    // 一時保管場所の情報
    tempStorage = {
        x: 100,
        y: 150,
        width: 100,
        height: 50,
        emoji: '🧺',
        capacity: 20,
        storedCrops: {}
    };

    // 運搬機械の情報
    conveyor = {
        x: tempStorage.x + tempStorage.width,
        y: tempStorage.y + tempStorage.height / 2,
        width: 20,
        height: 20,
        emoji: '🤖',
        speed: 2,
        lastMoveTime: 0,
        moveInterval: 1,
        upgrade: { x: 600, y: 310, width: 180, height: 40, cost: 500, level: 0, text: '運搬機械を雇う' }
    };

    // 畑のアップグレード
    fieldUpgrade = {
        buy: { x: 600, y: 360, width: 180, height: 40, cost: 50, text: '畑を増やす' }
    };

    // イベントリスナーの設定
    window.addEventListener('keydown', (e) => { keys[e.key] = true; });
    window.addEventListener('keyup', (e) => { keys[e.key] = false; });
    canvas.addEventListener('touchstart', (e) => {
        const rect = canvas.getBoundingClientRect();
        touch.x = e.touches[0].clientX - rect.left;
        touch.y = e.touches[0].clientY - rect.top;
        touch.isMoving = true;
        e.preventDefault();
    }, { passive: false });
    canvas.addEventListener('touchend', () => { touch.isMoving = false; }, { passive: false });
    canvas.addEventListener('click', handleCanvasClick);
    
    // グローバルスコープに公開する関数
    window.sellOneCrop = sellOneCrop;
    window.buyOneCrop = buyOneCrop;
    window.sellAllCrops = sellAllCrops;
    window.sortItems = sortItems;
}

/**
 * キャンバスクリックイベントのハンドラ
 * @param {MouseEvent} e - マウスイベント
 */
function handleCanvasClick(e) {
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const buttonWidth = 120;
    const buttonHeight = 40;
    const buttonMargin = 10;
    const startY = canvas.height - buttonHeight - buttonMargin;

    // エクスポート/インポートボタンのクリック処理
    if (x >= buttonMargin && x <= buttonMargin + buttonWidth && y >= startY && y <= startY + buttonHeight) { exportGame(); }
    if (x >= buttonMargin * 2 + buttonWidth && x <= buttonMargin * 2 + buttonWidth * 2 && y >= startY && y <= startY + buttonHeight) { importGame(); }
    
    // プレイヤーのアップグレードボタン
    for (const key in upgradeButtons) {
        const button = upgradeButtons[key];
        if (x >= button.x && x <= button.x + button.width && y >= button.y && y <= button.y + button.height) {
            if (gameState.cash >= button.cost) {
                gameState.cash -= button.cost;
                button.level++;
                button.cost += 10;
                if (key === 'speed') { player.speed += 1; gameState.message = `移動速度がアップしました！Lv.${button.level}`; }
                else if (key === 'harvest') { player.harvestAbility += 1; gameState.message = `回収能力がアップしました！Lv.${button.level}`; }
            } else { gameState.message = 'キャッシュが足りません！'; }
        }
    }
    // お手伝いさんのアップグレードボタン
    for (const key in workerUpgrade) {
        const button = workerUpgrade[key];
        if (x >= button.x && x <= button.x + button.width && y >= button.y && y <= button.y + button.height) {
            if (gameState.cash >= button.cost) {
                gameState.cash -= button.cost;
                button.level++;
                button.cost += 50;
                if (key === 'hire') {
                    const newWorker = {
                        x: Math.random() * canvas.width, y: Math.random() * canvas.height, size: 30,
                        emoji: '🤖', speed: 3, harvestAbility: 1, targetField: null
                    };
                    workers.push(newWorker);
                    gameState.message = `新しいお手伝いさん（Lv.${button.level}）を雇いました！`;
                } else if (key === 'speed') {
                    workers.forEach(worker => worker.speed++);
                    gameState.message = `お手伝いさんの速度がアップしました！Lv.${button.level}`;
                } else if (key === 'ability') {
                    workers.forEach(worker => worker.harvestAbility++);
                    gameState.message = `お手伝いさんの運搬量が増えました！Lv.${button.level}`;
                }
            } else { gameState.message = 'キャッシュが足りません！'; }
        }
    }
    // 倉庫アップグレードボタン
    const warehouseButton = warehouse.upgrade;
    if (x >= warehouseButton.x && x <= warehouseButton.x + warehouseButton.width && y >= warehouseButton.y && y <= warehouseButton.y + warehouseButton.height) {
        if (gameState.cash >= warehouseButton.cost) {
            gameState.cash -= warehouseButton.cost;
            warehouseButton.level++;
            warehouseButton.cost += 100;
            warehouse.capacity += 50;
            gameState.message = `倉庫の容量がアップしました！Lv.${warehouseButton.level}`;
        } else { gameState.message = 'キャッシュが足りません！'; }
    }
    // 運搬機械アップグレードボタン
    const conveyorButton = conveyor.upgrade;
    if (x >= conveyorButton.x && x <= conveyorButton.x + conveyorButton.width && y >= conveyorButton.y && y <= conveyorButton.y + conveyorButton.height) {
        if (gameState.cash >= conveyorButton.cost) {
            gameState.cash -= conveyorButton.cost;
            conveyorButton.level++;
            conveyorButton.cost += 200;
            gameState.message = `運搬機械のレベルがアップしました！Lv.${conveyorButton.level}`;
        } else { gameState.message = 'キャッシュが足りません！'; }
    }
    // 畑購入ボタン
    const fieldBuyButton = fieldUpgrade.buy;
    if (x >= fieldBuyButton.x && x <= fieldBuyButton.x + fieldBuyButton.width && y >= fieldBuyButton.y + 50 && y <= fieldBuyButton.y + 50 + fieldBuyButton.height) {
        if (gameState.cash >= fieldBuyButton.cost) {
            gameState.cash -= fieldBuyButton.cost;
            fieldBuyButton.cost += 50;
            const newField = {
                x: Math.random() * (canvas.width - 200) + 100, y: Math.random() * (canvas.height - 200) + 100,
                size: 40, crop: null, growTime: 0, plantTime: 0, readyTime: 0, isHarvestable: false, isWithered: false
            };
            fields.push(newField);
            gameState.message = '新しい畑を購入しました！';
        } else { gameState.message = 'キャッシュが足りません！'; }
    }
    
    // 畑のクリック処理（種植え）
    fields.forEach(field => {
        const dx = (player.x + player.size / 2) - field.x;
        const dy = (player.y + player.size / 2) - field.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        if (distance < 50 && !field.crop) {
            const availableCrops = Object.keys(gameState.requiredCrops);
            if (availableCrops.length > 0) {
                const cropName = availableCrops[Math.floor(Math.random() * availableCrops.length)];
                const cropInfo = crops.find(c => c.name === cropName);
                field.crop = cropInfo;
                field.plantTime = Date.now();
                field.growTime = cropInfo.growTime;
                gameState.message = `${cropName}の種を植えました！`;
            }
        }
    });
}

// 配送トラックと配送ゾーンの情報
const car = { x: 0, y: 250, width: 80, height: 60, emoji: '🚚' };
const deliveryZone = { x: 80, y: 250, width: 50, height: 60, color: 'rgba(255, 255, 255, 0.5)' };

/** 描画関数 */
function drawPlayer() {
    ctx.font = `${player.size}px Arial`;
    ctx.fillText(player.emoji, player.x, player.y);
    
    ctx.fillStyle = 'red';
    ctx.font = '16px Arial';
    ctx.fillText(`回収力: x${player.harvestAbility}`, player.x, player.y - 10);
}

function drawFields() {
    const currentTime = Date.now();
    fields.forEach(field => {
        ctx.fillStyle = '#C0A068';
        ctx.fillRect(field.x - field.size/2, field.y - field.size/2, field.size, field.size);
        ctx.strokeStyle = '#663300';
        ctx.strokeRect(field.x - field.size/2, field.y - field.size/2, field.size, field.size);
        
        if (field.crop) {
            if (field.isWithered) {
                ctx.font = `${field.size}px Arial`;
                ctx.fillText('🥀', field.x - field.size/2, field.y + field.size/2);
            } else if (field.isHarvestable) {
                ctx.font = `${field.size}px Arial`;
                ctx.fillText(field.crop.emoji, field.x - field.size/2, field.y + field.size/2);
            } else {
                const progress = (currentTime - field.plantTime) / field.growTime;
                const growSize = field.size * Math.min(1, progress);
                ctx.font = `${growSize}px Arial`;
                ctx.fillText(field.crop.emoji, field.x - growSize/2, field.y + growSize/2);
                
                if (progress < 1) {
                    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
                    ctx.fillRect(field.x - field.size/2, field.y + field.size/2 + 5, field.size, 5);
                    ctx.fillStyle = 'lime';
                    ctx.fillRect(field.x - field.size/2, field.y + field.size/2 + 5, field.size * progress, 5);
                }
            }
        } else {
            ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
            ctx.font = '12px Arial';
            ctx.fillText('畑', field.x - 10, field.y + 5);
        }
    });
}

function drawRoadAndCar() {
    ctx.fillStyle = '#444';
    ctx.fillRect(0, 0, car.width, canvas.height);

    ctx.fillStyle = deliveryZone.color;
    ctx.fillRect(deliveryZone.x, deliveryZone.y, deliveryZone.width, deliveryZone.height);

    ctx.font = `${car.height}px Arial`;
    ctx.fillText(car.emoji, car.x, car.y + car.height);

    ctx.fillStyle = 'white';
    ctx.font = '16px Arial';
    ctx.fillText('要求:', car.x + 5, car.y + car.height + 20);
    let yOffset = 40;
    for (const cropName in gameState.requiredCrops) {
        const requiredAmount = gameState.requiredCrops[cropName];
        const storedAmount = warehouse.storedCrops[cropName] || 0;
        ctx.fillText(`${cropName}: ${storedAmount} / ${requiredAmount}`, car.x + 5, car.y + car.height + yOffset);
        yOffset += 20;
    }
}

function drawUI() {
    ctx.fillStyle = 'black';
    ctx.font = '20px Arial';
    ctx.fillText(`キャッシュ: ${gameState.cash}`, 10, 30);
    
    if (gameState.message !== '') {
        ctx.fillStyle = 'red';
        ctx.font = '30px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(gameState.message, canvas.width / 2, canvas.height / 2);
        setTimeout(() => gameState.message = '', 2000);
    }
    ctx.textAlign = 'left';

    drawButtons();
    drawUpgradeButtons();
    drawWorkerButtons();
    drawWarehouseButton();
    drawConveyorButton();
    drawFieldButtons();
}

function drawButtons() {
    const buttonWidth = 120;
    const buttonHeight = 40;
    const buttonMargin = 10;
    const startY = canvas.height - buttonHeight - buttonMargin;

    ctx.fillStyle = '#4CAF50';
    ctx.fillRect(buttonMargin, startY, buttonWidth, buttonHeight);
    ctx.fillStyle = 'white';
    ctx.font = '20px Arial';
    ctx.fillText('エクスポート', buttonMargin + 10, startY + 28);

    ctx.fillStyle = '#2196F3';
    ctx.fillRect(buttonMargin * 2 + buttonWidth, startY, buttonWidth, buttonHeight);
    ctx.fillStyle = 'white';
    ctx.fillText('インポート', buttonMargin * 2 + buttonWidth + 15, startY + 28);
}

function drawUpgradeButtons() {
    for (const key in upgradeButtons) {
        const button = upgradeButtons[key];
        ctx.fillStyle = (gameState.cash >= button.cost) ? '#FFA500' : '#CCCCCC';
        ctx.fillRect(button.x, button.y, button.width, button.height);
        
        ctx.fillStyle = 'black';
        ctx.font = '16px Arial';
        ctx.fillText(`${button.text} Lv.${button.level}`, button.x + 10, button.y + 18);
        ctx.fillText(`コスト: ${button.cost}`, button.x + 10, button.y + 36);
    }
}

function drawWorkerButtons() {
    for (const key in workerUpgrade) {
        const button = workerUpgrade[key];
        ctx.fillStyle = (gameState.cash >= button.cost) ? '#8E44AD' : '#CCCCCC';
        ctx.fillRect(button.x, button.y, button.width, button.height);

        ctx.fillStyle = 'white';
        ctx.font = '16px Arial';
        ctx.fillText(`${button.text} Lv.${button.level}`, button.x + 10, button.y + 18);
        ctx.fillText(`コスト: ${button.cost}`, button.x + 10, button.y + 36);
    }
}

function drawWarehouseButton() {
    const button = warehouse.upgrade;
    ctx.fillStyle = (gameState.cash >= button.cost) ? '#008000' : '#CCCCCC';
    ctx.fillRect(button.x, button.y, button.width, button.height);

    ctx.fillStyle = 'white';
    ctx.font = '16px Arial';
    ctx.fillText(`${button.text} Lv.${button.level}`, button.x + 10, button.y + 18);
    ctx.fillText(`コスト: ${button.cost}`, button.x + 10, button.y + 36);
}

function drawConveyorButton() {
    const button = conveyor.upgrade;
    ctx.fillStyle = (gameState.cash >= button.cost) ? '#3498DB' : '#CCCCCC';
    ctx.fillRect(button.x, button.y, button.width, button.height);

    ctx.fillStyle = 'white';
    ctx.font = '16px Arial';
    if (button.level === 0) {
        ctx.fillText(button.text, button.x + 10, button.y + 28);
    } else {
        ctx.fillText(`運搬機械Lv.${button.level}`, button.x + 10, button.y + 18);
        ctx.fillText(`コスト: ${button.cost}`, button.x + 10, button.y + 36);
    }
}

function drawFieldButtons() {
    const button = fieldUpgrade.buy;
    ctx.fillStyle = (gameState.cash >= button.cost) ? '#A0522D' : '#CCCCCC';
    ctx.fillRect(button.x, button.y + 50, button.width, button.height);
    
    ctx.fillStyle = 'white';
    ctx.font = '16px Arial';
    ctx.fillText(button.text, button.x + 10, button.y + 68);
    ctx.fillText(`コスト: ${button.cost}`, button.x + 10, button.y + 86);
}

function drawWarehouse() {
    ctx.font = `${warehouse.height}px Arial`;
    ctx.fillText(warehouse.emoji, warehouse.x, warehouse.y + warehouse.height);
}

function drawTemporaryStorage() {
    ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
    ctx.fillRect(tempStorage.x, tempStorage.y, tempStorage.width, tempStorage.height);
    ctx.strokeStyle = '#663300';
    ctx.strokeRect(tempStorage.x, tempStorage.y, tempStorage.width, tempStorage.height);
    
    ctx.font = '24px Arial';
    ctx.fillText(tempStorage.emoji, tempStorage.x + tempStorage.width / 2 - 12, tempStorage.y + tempStorage.height / 2 + 8);

    ctx.fillStyle = 'black';
    ctx.font = '12px Arial';
    let storedCount = Object.values(tempStorage.storedCrops).reduce((sum, count) => sum + count, 0);
    ctx.fillText(`一時保管: ${storedCount} / ${tempStorage.capacity}`, tempStorage.x, tempStorage.y - 5);
}

function drawConveyor() {
    if (conveyor.upgrade.level > 0) {
        ctx.font = `${conveyor.height}px Arial`;
        ctx.fillText(conveyor.emoji, conveyor.x, conveyor.y + conveyor.height);
    }
}

function drawWorkers() {
    workers.forEach(worker => {
        ctx.font = `${worker.size}px Arial`;
        ctx.fillText(worker.emoji, worker.x, worker.y);
    });
}

/** 更新関数 */
function updatePlayer() {
    // キーボード入力による移動
    if (keys['ArrowUp']) { player.y -= player.speed; }
    if (keys['ArrowDown']) { player.y += player.speed; }
    if (keys['ArrowLeft']) { player.x -= player.speed; }
    if (keys['ArrowRight']) { player.x += player.speed; }

    // タッチ操作による移動
    if (touch.isMoving) {
        const dx = touch.x - (player.x + player.size / 2);
        const dy = touch.y - (player.y + player.size / 2);
        const distance = Math.sqrt(dx * dx + dy * dy);
        if (distance > 10) {
            player.x += dx / distance * player.speed;
            player.y += dy / distance * player.speed;
        }
    }

    // 画面端の境界チェック
    player.x = Math.max(0, Math.min(canvas.width - player.size, player.x));
    player.y = Math.max(0, Math.min(canvas.height - player.size, player.y));

    const playerCenterX = player.x + player.size / 2;
    const playerCenterY = player.y + player.size / 2;

    // 配送ゾーンでの処理
    if (playerCenterX > deliveryZone.x && 
        playerCenterX < deliveryZone.x + deliveryZone.width &&
        playerCenterY > deliveryZone.y &&
        playerCenterY < deliveryZone.y + deliveryZone.height) {
        
        let canDeliver = true;
        let deliveryValue = 0;
        
        for (const cropName in gameState.requiredCrops) {
            const required = gameState.requiredCrops[cropName];
            const stored = warehouse.storedCrops[cropName] || 0;
            if (stored < required) {
                canDeliver = false;
                break;
            }
            deliveryValue += required * (cropPrices[cropName]?.sell || 1);
        }

        if (canDeliver) {
            gameState.cash += deliveryValue;
            for (const cropName in gameState.requiredCrops) {
                warehouse.storedCrops[cropName] -= gameState.requiredCrops[cropName];
            }

            gameState.deliveryLevel++;
            gameState.message = `レベル${gameState.deliveryLevel}にアップしました！`;
            
            let newRequiredCrops = {};
            const availableCrops = crops.map(c => c.name);
            availableCrops.forEach(cropName => {
                newRequiredCrops[cropName] = Math.floor(Math.random() * 5) + 1;
            });
            gameState.requiredCrops = newRequiredCrops;
            
            if (gameState.deliveryLevel % 2 === 0) { player.harvestAbility++; }
        } else {
            gameState.message = '作物が足りません！';
        }
    }
}

function updateFields() {
    const currentTime = Date.now();
    let totalStored = Object.values(warehouse.storedCrops).reduce((sum, count) => sum + count, 0);
        // 作物の成長と枯れ
    fields.forEach(field => {
        if (field.crop) {
            if (!field.isHarvestable && (currentTime - field.plantTime > field.growTime)) {
                field.isHarvestable = true;
                field.readyTime = currentTime;
            }
            
            if (field.isHarvestable && !field.isWithered && (currentTime - field.readyTime > 60000)) {
                field.isWithered = true;
                gameState.message = '作物が枯れて、自動収穫されました！';
                const witheredHarvestAmount = player.harvestAbility * 2;
                
                if (!warehouse.storedCrops[field.crop.name]) { warehouse.storedCrops[field.crop.name] = 0; }
                warehouse.storedCrops[field.crop.name] += witheredHarvestAmount;
                
                const availableCrops = Object.keys(gameState.requiredCrops);
                if (availableCrops.length > 0) {
                    const cropName = availableCrops[Math.floor(Math.random() * availableCrops.length)];
                    const cropInfo = crops.find(c => c.name === cropName);
                    field.crop = cropInfo;
                    field.plantTime = Date.now();
                    field.growTime = cropInfo.growTime;
                    field.isHarvestable = false;
                    field.isWithered = false;
                }
            }
        }
    });
        // プレイヤーによる収穫
    fields.forEach(field => {
        const dx = (player.x + player.size / 2) - field.x;
        const dy = (player.y + player.size / 2) - field.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < 50 && field.isHarvestable && !field.isWithered && totalStored < warehouse.capacity) {
            const harvestedAmount = Math.min(player.harvestAbility, warehouse.capacity - totalStored);
            if (harvestedAmount > 0) {
                if (!warehouse.storedCrops[field.crop.name]) { warehouse.storedCrops[field.crop.name] = 0; }
                warehouse.storedCrops[field.crop.name] += harvestedAmount;

                field.crop = null;
                field.isHarvestable = false;
                field.readyTime = 0;
            } else {
                gameState.message = '倉庫がいっぱいです！';
            }
        }
    });
}
function updateWorkers() {
    const currentTime = Date.now();
    let totalTempStored = Object.values(tempStorage.storedCrops).reduce((sum, count) => sum + count, 0);
        // ワーカーの動作
    workers.forEach(worker => {
        if (!worker.targetField || !worker.targetField.isHarvestable || worker.targetField.isWithered) {
            let closestField = null;
            let minDistance = Infinity;
            fields.forEach(field => {
                if (field.isHarvestable && !field.isWithered) {
                    const dx = (worker.x + worker.size / 2) - field.x;
                    const dy = (worker.y + worker.size / 2) - field.y;
                    const distance = Math.sqrt(dx * dx + dy * dy);
                    if (distance < minDistance) {
                        minDistance = distance;
                        closestField = field;
                    }
                }
            });
            worker.targetField = closestField;
        }

        if (worker.targetField) {
            const targetX = tempStorage.x + tempStorage.width / 2;
            const targetY = tempStorage.y + tempStorage.height / 2;
            const dx = targetX - worker.x;
            const dy = targetY - worker.y;
            const distance = Math.sqrt(dx * dx + dy * dy);

            if (distance > 10) {
                worker.x += (dx / distance) * worker.speed;
                worker.y += (dy / distance) * worker.y;
            } else {
                if (totalTempStored < tempStorage.capacity) {
                    if (worker.targetField.isHarvestable) {
                        if (!tempStorage.storedCrops[worker.targetField.crop.name]) { tempStorage.storedCrops[worker.targetField.crop.name] = 0; }
                        tempStorage.storedCrops[worker.targetField.crop.name] += worker.harvestAbility;
                        
                        worker.targetField.crop = null;
                        worker.targetField.isHarvestable = false;
                        worker.targetField.readyTime = 0;
                    }
                    worker.targetField = null;
                } else {
                    gameState.message = '一時保管場所がいっぱいです！';
                }
            }
        }
    });
}
function updateConveyor() {
    if (conveyor.upgrade.level > 0) {
        const currentTime = Date.now() / 1000;
        if (currentTime > conveyor.lastMoveTime + conveyor.moveInterval) {
            for (const cropName in tempStorage.storedCrops) {
                const tempCount = tempStorage.storedCrops[cropName];
                if (tempCount > 0) {
                    const warehouseTotal = Object.values(warehouse.storedCrops).reduce((sum, count) => sum + count, 0);
                    if (warehouseTotal < warehouse.capacity) {
                        const moveAmount = Math.min(tempCount, conveyor.upgrade.level, warehouse.capacity - warehouseTotal);
                        if (moveAmount > 0) {
                            tempStorage.storedCrops[cropName] -= moveAmount;
                            if (!warehouse.storedCrops[cropName]) { warehouse.storedCrops[cropName] = 0; }
                            warehouse.storedCrops[cropName] += moveAmount;
                        }
                    } else {
                        gameState.message = '倉庫がいっぱいです！';
                    }
                }
            }
            conveyor.lastMoveTime = currentTime;
        }
    }
}


/**
 * ゲームのメインループ
 */
export function gameLoop() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    updatePlayer();
    updateFields();
    updateWorkers();
    updateConveyor();
    drawRoadAndCar();
    drawWarehouse();
    drawTemporaryStorage();
    drawConveyor();
    drawPlayer();
    drawFields();
    drawWorkers();
    drawUI();
    requestAnimationFrame(gameLoop);
}

/** ドロップダウン関連の関数 */
export function updateWarehouseDropdown() {
    const warehouseItemList = document.getElementById('warehouseItemList');
    const totalStoredElement = document.getElementById('totalStored');
    const storedItems = Object.entries(warehouse.storedCrops);
    let totalStored = 0;

    if (sortMethod === 'count') {
        storedItems.sort((a, b) => b[1] - a[1]);
    } else if (sortMethod === 'name') {
        storedItems.sort((a, b) => a[0].localeCompare(b[0]));
    }

    warehouseItemList.innerHTML = '';
    storedItems.forEach(([name, count]) => {
        if (count > 0) {
            const li = document.createElement('li');
            li.classList.add('flex', 'justify-between', 'items-center', 'py-1');
            li.innerHTML = `
                <span class="text-sm">${name}: ${count}個</span>
                <div>
                    <button class="sell-button" onclick="sellOneCrop('${name}')">1個売る</button>
                    <button class="sell-all-button" onclick="sellAllCrops('${name}')">全て売却</button>
                </div>
            `;
            warehouseItemList.appendChild(li);
            totalStored += count;
        }
    });
    
    totalStoredElement.textContent = `合計: ${totalStored} / ${warehouse.capacity}`;
}

export function updateMarketDropdown() {
    const marketItemList = document.getElementById('marketItemList');
    marketItemList.innerHTML = '';
    const allCrops = crops.map(c => c.name);
    allCrops.forEach(name => {
        const price = cropPrices[name]?.buy || 2;
        const li = document.createElement('li');
        li.classList.add('flex', 'justify-between', 'items-center', 'py-1');
        li.innerHTML = `
            <span class="text-sm">${name} (コスト: ${price} キャッシュ)</span>
            <button class="buy-button" onclick="buyOneCrop('${name}')">1個買う</button>
        `;
        marketItemList.appendChild(li);
    });
}

export function sortItems(method) {
    sortMethod = method;
    updateWarehouseDropdown();
}

export function sellOneCrop(cropName) {
    if (warehouse.storedCrops[cropName] > 0) {
        const basePrice = cropPrices[cropName]?.sell || 1;
        gameState.cash += basePrice;
        warehouse.storedCrops[cropName]--;
        gameState.message = `${cropName}を1個売却し、${basePrice}キャッシュを獲得しました！`;
        updateWarehouseDropdown();
    } else {
        gameState.message = '在庫がありません。';
    }
}

export function buyOneCrop(cropName) {
    const totalStored = Object.values(warehouse.storedCrops).reduce((sum, count) => sum + count, 0);
    if (totalStored >= warehouse.capacity) {
        gameState.message = '倉庫がいっぱいです！';
        return;
    }

    const price = cropPrices[cropName]?.buy || 2;
    if (gameState.cash >= price) {
        gameState.cash -= price;
        if (!warehouse.storedCrops[cropName]) { warehouse.storedCrops[cropName] = 0; }
        warehouse.storedCrops[cropName]++;
        gameState.message = `${cropName}を1個購入しました！`;
        updateWarehouseDropdown();
    } else {
        gameState.message = 'キャッシュが足りません！';
    }
}

export function sellAllCrops(cropName) {
    const quantity = warehouse.storedCrops[cropName] || 0;
    if (quantity === 0) return;

    let priceMultiplier = 1;
    if (quantity >= 100) {
        priceMultiplier = 2.0;
    } else if (quantity >= 50) {
        priceMultiplier = 1.5;
    } else if (quantity >= 10) {
        priceMultiplier = 1.2;
    }

    const basePrice = cropPrices[cropName]?.sell || 1;
    const cashEarned = Math.floor(quantity * basePrice * priceMultiplier);

    gameState.cash += cashEarned;
    warehouse.storedCrops[cropName] = 0;
    gameState.message = `${cropName}を${cashEarned}キャッシュで売却しました！`;
    updateWarehouseDropdown();
}