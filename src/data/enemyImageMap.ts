/**
 * 敌人名 → PNG 图片路径映射
 * 有映射的敌人用 PNG 显示，无映射的回退到像素矩阵
 */
import f401 from '../assets/enemies/forest_401.png';
import f402 from '../assets/enemies/forest_402.png';
import f403 from '../assets/enemies/forest_403.png';
import f404 from '../assets/enemies/forest_404.png';
import f405 from '../assets/enemies/forest_405.png';
import f406 from '../assets/enemies/forest_406.png';
import f407 from '../assets/enemies/forest_407.png';
import f408 from '../assets/enemies/forest_408.png';
import f409 from '../assets/enemies/forest_409.png';
import f410 from '../assets/enemies/forest_410.png';
import f411 from '../assets/enemies/forest_411.png';
import f412 from '../assets/enemies/forest_412.png';

export const ENEMY_IMAGE_MAP: Record<string, string> = {
  // 第1章 · 幽暗森林 (12张图 → 17个敌人，部分复用)
  '食尸鬼': f407,        // 棕色人形兽
  '剧毒蛛母': f403,      // 棕红甲壳虫
  '腐化树人': f402,       // 绿色蘑菇/植物
  '哀嚎女妖': f408,       // 蓝色飞行生物
  '月光狼灵': f401,       // 金色小型生物
  '骸骨狂战': f406,       // 灰棕猿人
  '毒雾林精': f401,       // 金色小型(复用)
  '苔岩泥像': f404,       // 棕色矮胖岩
  '幽冥诅祝': f407,       // 棕色人形(复用)
  '老槐祭司': f409,       // 绿色大树
  '亡灵巫师': f406,       // 灰棕人形(复用)
  '狼人首领': f405,       // 棕色大熊/兽
  '魅影猎手': f408,       // 蓝色飞行(复用)
  '枯骨巫妖': f412,       // 棕红大型魔兽
  '根须巨像': f410,       // 灰色岩石巨兽
  '魇森巫母': f411,       // 绿色大蜥蜴
  '远古树王': f409,       // 绿色大树(复用，Boss放大)
};
