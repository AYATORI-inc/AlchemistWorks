// --- 1. データ定義 (基本素材9種・レシピ20種超) ---

const itemsDB = {
    // 【基本素材】(9種) - ここからスタート
    'herb': { name: '薬草', icon: '🌿' },
    'water': { name: '水', icon: '💧' },
    'slime': { name: 'スライム', icon: '🔵' },
    'fire_stone': { name: '火の石', icon: '🔥' },
    'magic_sand': { name: '魔法の砂', icon: '✨' },
    'feather': { name: '羽根', icon: '🪶' },       // NEW
    'iron_ore': { name: '鉄鉱石', icon: '🪨' },     // NEW
    'dark_dust': { name: '闇の粉', icon: '🌑' },    // NEW
    'elec_stone': { name: '電気石', icon: '⚡' },   // NEW

    // 【Tier 1 合成】(基本素材同士)
    'potion': { name: '回復薬', icon: '🍷' },
    'poison': { name: '毒薬', icon: '☠️' },
    'bomb': { name: '爆弾', icon: '💣' },
    'steam': { name: '蒸気', icon: '☁️' },
    'glass': { name: 'ガラス', icon: '🥃' },
    'jewel': { name: '宝石', icon: '💎' },
    'holy_water': { name: '聖水', icon: '💧✨' },
    'wing': { name: '翼', icon: '👼' },             // 羽根 + 魔法の砂
    'ingot': { name: '鉄インゴット', icon: '🧱' },  // 鉄鉱石 + 火の石
    'thunder': { name: '雷', icon: '🌩️' },          // 電気石 + 水
    'dark_matter': { name: '暗黒物質', icon: '🌌' },// 闇の粉 + スライム

    // 【Tier 2 複合合成】(合成品を含む)
    'high_potion': { name: '上薬草', icon: '🍀✨' },
    'big_bomb': { name: '大爆発', icon: '💥' },
    'elixir': { name: 'エリクサー', icon: '🍷💎' },
    'hourglass': { name: '砂時計', icon: '⏳' },
    'sword': { name: '剣', icon: '⚔️' },            // インゴット + インゴット
    'angel': { name: '天使', icon: '👱‍♀️' },          // 翼 + 聖水
    'demon': { name: '悪魔', icon: '👿' },          // 翼 + 闇の粉
    'robot': { name: 'ロボット', icon: '🤖' },      // インゴット + 電気石
    'light_bulb': { name: '電球', icon: '💡' },     // ガラス + 電気石

    // 【Legendary / Special】
    'philosopher_stone': { name: '賢者の石', icon: '🔴✨' },
    'hero': { name: '勇者', icon: '👑' },           // 剣 + 天使
    'maou': { name: '魔王', icon: '👹' }            // 悪魔 + 大爆発
};

// レシピ定義
const recipes = [
    // --- 基本レシピ ---
    { ingredients: ['herb', 'water'], result: 'potion', discovered: false },
    { ingredients: ['herb', 'slime'], result: 'poison', discovered: false },
    { ingredients: ['fire_stone', 'slime'], result: 'bomb', discovered: false },
    { ingredients: ['fire_stone', 'water'], result: 'steam', discovered: false },
    
    // --- 魔法の砂レシピ ---
    { ingredients: ['magic_sand', 'fire_stone'], result: 'glass', discovered: false },
    { ingredients: ['magic_sand', 'slime'], result: 'jewel', discovered: false },
    { ingredients: ['magic_sand', 'water'], result: 'holy_water', discovered: false },
    
    // --- 新素材レシピ (Tier 1) ---
    { ingredients: ['feather', 'magic_sand'], result: 'wing', discovered: false },
    { ingredients: ['iron_ore', 'fire_stone'], result: 'ingot', discovered: false },
    { ingredients: ['elec_stone', 'water'], result: 'thunder', discovered: false },
    { ingredients: ['dark_dust', 'slime'], result: 'dark_matter', discovered: false },
    { ingredients: ['glass', 'elec_stone'], result: 'light_bulb', discovered: false },

    // --- 応用レシピ (Tier 2) ---
    { ingredients: ['potion', 'herb'], result: 'high_potion', discovered: false },
    { ingredients: ['bomb', 'fire_stone'], result: 'big_bomb', discovered: false },
    { ingredients: ['potion', 'slime'], result: 'elixir', discovered: false },
    { ingredients: ['glass', 'magic_sand'], result: 'hourglass', discovered: false },
    
    // --- 上級レシピ ---
    { ingredients: ['ingot', 'ingot'], result: 'sword', discovered: false }, // 同じもの2つ
    { ingredients: ['wing', 'holy_water'], result: 'angel', discovered: false },
    { ingredients: ['wing', 'dark_dust'], result: 'demon', discovered: false },
    { ingredients: ['ingot', 'elec_stone'], result: 'robot', discovered: false },
    
    // --- 伝説級レシピ ---
    { ingredients: ['jewel', 'holy_water'], result: 'philosopher_stone', discovered: false },
    { ingredients: ['angel', 'sword'], result: 'hero', discovered: false },
    { ingredients: ['demon', 'big_bomb'], result: 'maou', discovered: false },
];

// 初期状態で表示する素材IDリスト (9個)
const initialMaterials = [
    'herb', 'water', 'slime', 'fire_stone', 'magic_sand',
    'feather', 'iron_ore', 'dark_dust', 'elec_stone'
];


// --- 2. DOM要素の取得 ---
const materialList = document.getElementById('material-list');
const cauldronZone = document.getElementById('cauldron-dropzone');
const inventoryList = document.getElementById('inventory-list');
const recipeList = document.getElementById('recipe-list');
const mixBtn = document.getElementById('mix-btn');
const messageArea = document.getElementById('message-area');


// --- 3. 初期化処理 ---
function init() {
    // 素材ボックス
    initialMaterials.forEach(itemId => {
        materialList.appendChild(createItemElement(itemId));
    });
    // 図鑑初期化
    renderRecipeBook();
}


// --- 4. アイテム生成とD&D ---
function createItemElement(itemId) {
    const itemData = itemsDB[itemId];
    const div = document.createElement('div');
    div.classList.add('item');
    div.setAttribute('draggable', 'true');
    div.dataset.id = itemId;
    div.innerHTML = `<span class="icon">${itemData.icon}</span><span class="name">${itemData.name}</span>`;
    div.addEventListener('dragstart', handleDragStart);
    return div;
}

function handleDragStart(e) {
    e.dataTransfer.setData('text/plain', e.target.dataset.id);
    e.dataTransfer.effectAllowed = 'copy';
}

cauldronZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
    cauldronZone.classList.add('drag-over');
});

cauldronZone.addEventListener('dragleave', () => cauldronZone.classList.remove('drag-over'));

cauldronZone.addEventListener('drop', (e) => {
    e.preventDefault();
    cauldronZone.classList.remove('drag-over');
    
    const placeholder = cauldronZone.querySelector('.placeholder');
    if (placeholder) placeholder.remove();

    const currentItems = cauldronZone.querySelectorAll('.item');
    if (currentItems.length >= 2) {
        showMessage('釜がいっぱいです！', 'failure');
        cauldronZone.animate([
            { transform: 'translateX(0)' }, { transform: 'translateX(-5px)' },
            { transform: 'translateX(5px)' }, { transform: 'translateX(0)' }
        ], { duration: 200 });
        return;
    }

    const itemId = e.dataTransfer.getData('text/plain');
    const newItem = createItemElement(itemId);
    newItem.setAttribute('draggable', 'false');
    newItem.style.cursor = 'default';
    cauldronZone.appendChild(newItem);
    showMessage('', '');
});


// --- 5. 調合ロジック ---

mixBtn.addEventListener('click', () => {
    const itemsInCauldron = Array.from(cauldronZone.querySelectorAll('.item'));
    if (itemsInCauldron.length !== 2) {
        showMessage('材料を2つ入れてください', 'failure');
        triggerShake();
        return;
    }

    const ingredientIds = itemsInCauldron.map(el => el.dataset.id);
    const matchedRecipe = findRecipe(ingredientIds);

    if (matchedRecipe) {
        startCraftingSequence(itemsInCauldron, matchedRecipe);
    } else {
        failCrafting();
    }
});

function findRecipe(currentIngredients) {
    const sortedCurrent = [...currentIngredients].sort().join(',');
    return recipes.find(recipe => {
        const sortedRecipe = [...recipe.ingredients].sort().join(',');
        return sortedCurrent === sortedRecipe;
    });
}

function startCraftingSequence(itemElements, recipe) {
    showMessage('調合中...', '');
    
    // 融合アニメーション
    itemElements.forEach(el => el.classList.add('merging'));

    setTimeout(() => {
        cauldronZone.innerHTML = '';
        triggerShockwave();
        triggerMegaSparkle();

        const resultId = recipe.result;
        const resultItem = createItemElement(resultId);
        resultItem.setAttribute('draggable', 'false');
        resultItem.classList.add('pop-appear');
        cauldronZone.appendChild(resultItem);

        finalizeSuccess(recipe);
    }, 800);
}

function finalizeSuccess(recipe) {
    const resultId = recipe.result;
    showMessage(`錬成成功！ ${itemsDB[resultId].name} ！`, 'success');

    const invItem = createItemElement(resultId);
    inventoryList.appendChild(invItem);

    if (!recipe.discovered) {
        recipe.discovered = true;
        renderRecipeBook();
        setTimeout(() => {
            showMessage(`新レシピ発見: ${itemsDB[resultId].name}`, 'success');
        }, 1500);
    }
}

function failCrafting() {
    showMessage('失敗... 何も起きなかった', 'failure');
    triggerShake();
    setTimeout(() => {
        cauldronZone.innerHTML = '<span class="placeholder">ここに素材を入れる</span>';
    }, 400);
}


// --- 6. 演出エフェクト ---

function triggerShockwave() {
    const wave = document.createElement('div');
    wave.classList.add('shockwave');
    cauldronZone.appendChild(wave);
    setTimeout(() => wave.remove(), 1000);
}

function triggerMegaSparkle() {
    const particleCount = 30;
    const colors = ['#FFD700', '#FFA500', '#FFFFFF', '#00BFFF', '#FF69B4', '#7FFF00'];

    for (let i = 0; i < particleCount; i++) {
        const sparkle = document.createElement('div');
        sparkle.textContent = ['✨', '★', '⚡', '✦'][Math.floor(Math.random() * 4)];
        sparkle.classList.add('sparkle');
        sparkle.style.color = colors[Math.floor(Math.random() * colors.length)];

        const angle = Math.random() * Math.PI * 2;
        const velocity = 50 + Math.random() * 150; 
        const tx = Math.cos(angle) * velocity + '%';
        const ty = Math.sin(angle) * velocity + '%';

        sparkle.style.setProperty('--tx', tx);
        sparkle.style.setProperty('--ty', ty);
        sparkle.style.left = '50%';
        sparkle.style.top = '50%';

        cauldronZone.appendChild(sparkle);
        setTimeout(() => sparkle.remove(), 1000);
    }
}

function triggerShake() {
    cauldronZone.classList.add('shake');
    setTimeout(() => cauldronZone.classList.remove('shake'), 400);
}

function showMessage(text, type) {
    messageArea.textContent = text;
    messageArea.className = type;
}

// --- 7. 図鑑描画 ---
function renderRecipeBook() {
    recipeList.innerHTML = '';
    recipes.forEach(recipe => {
        const div = document.createElement('div');
        div.classList.add('recipe-card');

        if (recipe.discovered) {
            const res = itemsDB[recipe.result];
            const ing1 = itemsDB[recipe.ingredients[0]].name;
            const ing2 = itemsDB[recipe.ingredients[1]].name;
            div.classList.add('unlocked');
            div.innerHTML = `
                <div style="font-weight:bold; font-size:1.1em;">${res.icon} ${res.name}</div>
                <div style="font-size:0.8em; color:#555;">${ing1} + ${ing2}</div>
            `;
        } else {
            div.classList.add('locked');
            div.innerHTML = `<div>🔒 ？？？</div>`;
        }
        recipeList.appendChild(div);
    });
}

// 開始
init();