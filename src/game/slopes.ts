import Phaser from 'phaser';
import { SLOPES } from './config';

// Manual slope support: Arcade Physics only does axis-aligned boxes,
// so hills are visual + these line segments, and entities snap their
// feet onto the segment under them each frame (see snapToSlope).

/** Walkable surface y at world x, or null when x is not over a slope. */
export function slopeSurfaceAt(x: number): number | null {
  for (const s of SLOPES) {
    const lo = Math.min(s.x1, s.x2) - 2;
    const hi = Math.max(s.x1, s.x2) + 2;
    if (x >= lo && x <= hi) {
      const t = (x - s.x1) / (s.x2 - s.x1);
      return s.y1 + t * (s.y2 - s.y1);
    }
  }
  return null;
}

/**
 * Snap a physics sprite's feet onto the slope surface under it.
 * @param feetOffset sprite.y + feetOffset = world y of the sprite's feet
 * @returns true when snapped (the caller should treat the sprite as grounded)
 *
 * Skipped while the sprite is moving upward fast so jumps pass through
 * the slope instead of sticking to it.
 */
export function snapToSlope(sprite: Phaser.Physics.Arcade.Sprite, feetOffset: number): boolean {
  const body = sprite.body as Phaser.Physics.Arcade.Body;
  if (!body || !body.enable) return false;
  const surf = slopeSurfaceAt(sprite.x);
  if (surf === null) return false;
  const dy = surf - (sprite.y + feetOffset);
  if (dy < -14 || dy > 34) return false;
  if (body.velocity.y < -60) return false;
  sprite.y += dy;
  body.updateFromGameObject();
  if (body.velocity.y > 0) body.setVelocityY(0);
  return true;
}
