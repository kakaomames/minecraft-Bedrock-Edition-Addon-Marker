// utils.js
// ゲームの状態管理とアドオンの読み込みを担当します
import {
    player, gameState, fields, upgradeButtons, workers, workerUpgrade,
    warehouse, tempStorage, conveyor, fieldUpgrade, hasAddon,
    updateWarehouseDropdown, updateMarketDropdown
} from './game.js';

/**
 * ゲームの状態をエクスポートしてダウンロードします
 */
export function exportGame() {
    // ゲームの全状態を一つのオブジェクトにまとめる
    const gameData = {
        player,
        gameState,
        fields,
        upgradeButtons,
        workers,
        workerUpgrade,
        warehouse,
        tempStorage,
        conveyor,
        fieldUpgrade
    };
    // JSON文字列に変換
    const jsonData = JSON.stringify(gameData);
    // Blobを作成し、ダウンロードリンクを生成
    const blob = new Blob([jsonData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `township-save-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

/**
 * ファイルからゲームの状態をインポートします
 */
export function importGame() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
                try {
                    const importedData = JSON.parse(event.target.result);
                    // 読み込んだデータでゲームの状態を更新
                    Object.assign(player, importedData.player);
                    Object.assign(gameState, importedData.gameState);
                    Object.assign(fields, importedData.fields);
                    Object.assign(upgradeButtons, importedData.upgradeButtons);
                    Object.assign(workers, importedData.workers);
                    Object.assign(workerUpgrade, importedData.workerUpgrade);
                    Object.assign(warehouse, importedData.warehouse);
                    Object.assign(tempStorage, importedData.tempStorage);
                    Object.assign(conveyor, importedData.conveyor);
                    Object.assign(fieldUpgrade, importedData.fieldUpgrade);
                    
                    gameState.message = 'ゲームデータを読み込みました！';
                } catch (error) {
                    console.error('データの読み込みに失敗しました:', error);
                    gameState.message = 'データの読み込みに失敗しました。';
                }
            };
            reader.readAsText(file);
        }
    };
    input.click();
}

/**
 * アドオンファイルを読み込みます
 * @param {File} file - アドオンファイル
 */
export function loadAddon(file) {
    if (file.name.endsWith('.pkadd')) {
        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                // ファイル内容をデコード
                const addonCode = atob(event.target.result);
                // 関数として実行
                const addonFunction = new Function('game', 'utils', addonCode);
                addonFunction({ player, gameState, fields, upgradeButtons, workers, workerUpgrade, warehouse, tempStorage, conveyor, fieldUpgrade }, exports);
                
                // アドオンが正常に読み込まれたことを示す
                hasAddon = true;
                gameState.message = 'アドオンが正常に読み込まれました！';
                
                // ドロップダウンメニューを更新
                updateWarehouseDropdown();
                updateMarketDropdown();
            } catch (error) {
                console.error('アドオンの読み込みに失敗しました:', error);
                gameState.message = 'アドオンの読み込みに失敗しました。';
            }
        };
        reader.readAsText(file);
    } else {
        gameState.message = '無効なファイル形式です。(.pkaddファイルを指定してください)';
    }
}

