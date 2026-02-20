/**
 * レシピ
 * GET /recipes?userId=xxx
 */

function handleRecipesGet(e) {
  var userId = Utils.getParam(e, 'userId');
  if (!userId) return { error: 'userId is required' };
  
  // TODO: Drive から個人レシピを読み込み
  var recipes = [];
  
  return { recipes: recipes };
}
