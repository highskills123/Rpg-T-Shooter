export const STRIP_FRAME_SIZE = 100;

function anim(source, frameCount) {
  return { source, frameCount };
}

export const PLAYER_SPRITES = {
  archer: {
    size: 264,
    previewSize: 296,
    animations: {
      idle: anim(require("../../assets/images/characters/archer-idle.png"), 6),
      walk: anim(require("../../assets/images/animations/players/archer-walk.png"), 8),
      attack: anim(require("../../assets/images/characters/archer-attack.png"), 9),
      hurt: anim(require("../../assets/images/animations/players/archer-hurt.png"), 4),
      death: anim(require("../../assets/images/animations/players/archer-death.png"), 4)
    }
  },
  soldier: {
    size: 264,
    previewSize: 296,
    animations: {
      idle: anim(require("../../assets/images/characters/soldier-idle.png"), 6),
      walk: anim(require("../../assets/images/animations/players/soldier-walk.png"), 8),
      attack: anim(require("../../assets/images/characters/soldier-attack.png"), 6),
      hurt: anim(require("../../assets/images/animations/players/soldier-hurt.png"), 4),
      death: anim(require("../../assets/images/animations/players/soldier-death.png"), 4)
    }
  },
  wizard: {
    size: 264,
    previewSize: 296,
    animations: {
      idle: anim(require("../../assets/images/characters/wizard-idle.png"), 6),
      walk: anim(require("../../assets/images/animations/players/wizard-walk.png"), 8),
      attack: anim(require("../../assets/images/characters/wizard-attack.png"), 6),
      hurt: anim(require("../../assets/images/animations/players/wizard-hurt.png"), 4),
      death: anim(require("../../assets/images/animations/players/wizard-death.png"), 4)
    }
  }
};

export const ENEMY_SPRITES = {
  slime: {
    size: 196,
    animations: {
      idle: anim(require("../../assets/images/enemies/slime-idle.png"), 6),
      walk: anim(require("../../assets/images/animations/enemies/slime-walk.png"), 6),
      attack: anim(require("../../assets/images/animations/enemies/slime-attack.png"), 6),
      hurt: anim(require("../../assets/images/animations/enemies/slime-hurt.png"), 4),
      death: anim(require("../../assets/images/animations/enemies/slime-death.png"), 4)
    }
  },
  skeleton: {
    size: 220,
    animations: {
      idle: anim(require("../../assets/images/enemies/skeleton-idle.png"), 6),
      walk: anim(require("../../assets/images/animations/enemies/skeleton-walk.png"), 8),
      attack: anim(require("../../assets/images/animations/enemies/skeleton-attack.png"), 6),
      hurt: anim(require("../../assets/images/animations/enemies/skeleton-hurt.png"), 4),
      death: anim(require("../../assets/images/animations/enemies/skeleton-death.png"), 4)
    }
  },
  skeletonArcher: {
    size: 220,
    animations: {
      idle: anim(require("../../assets/images/enemies/skeleton-archer-idle.png"), 6),
      walk: anim(require("../../assets/images/animations/enemies/skeleton-archer-walk.png"), 8),
      attack: anim(require("../../assets/images/animations/enemies/skeleton-archer-attack.png"), 9),
      hurt: anim(require("../../assets/images/animations/enemies/skeleton-archer-hurt.png"), 4),
      death: anim(require("../../assets/images/animations/enemies/skeleton-archer-death.png"), 4)
    }
  },
  armoredSkeleton: {
    size: 236,
    animations: {
      idle: anim(require("../../assets/images/enemies/armored-skeleton-idle.png"), 6),
      walk: anim(require("../../assets/images/animations/enemies/armored-skeleton-walk.png"), 8),
      attack: anim(require("../../assets/images/animations/enemies/armored-skeleton-attack.png"), 8),
      hurt: anim(require("../../assets/images/animations/enemies/armored-skeleton-hurt.png"), 4),
      death: anim(require("../../assets/images/animations/enemies/armored-skeleton-death.png"), 4)
    }
  },
  boss: {
    size: 360,
    animations: {
      idle: anim(require("../../assets/images/enemies/greatsword-skeleton-idle.png"), 6),
      walk: anim(require("../../assets/images/animations/enemies/greatsword-skeleton-walk.png"), 9),
      attack: anim(require("../../assets/images/animations/enemies/greatsword-skeleton-attack.png"), 9),
      hurt: anim(require("../../assets/images/animations/enemies/greatsword-skeleton-hurt.png"), 4),
      death: anim(require("../../assets/images/animations/enemies/greatsword-skeleton-death.png"), 4)
    }
  }
};

export const PLAYER_SKILL_EFFECTS = {
  archer: {
    source: require("../../assets/images/projectiles/archer-skill.png"),
    frameCount: 1,
    size: 32,
    hitRadius: 2,
    rotation: "-90deg"
  },
  soldier: {
    source: require("../../assets/images/projectiles/soldier-skill.png"),
    frameCount: 6,
    size: 44,
    hitRadius: 5,
    rotation: "-90deg"
  },
  wizard: {
    source: require("../../assets/images/projectiles/wizard-skill.png"),
    frameCount: 10,
    size: 42,
    hitRadius: 4,
    rotation: "0deg"
  }
};
