export const emojiNames = ['face-smile', 'face-laugh', 'face-grin-hearts', 'face-grin-stars', 'face-grin-wink', 'face-surprise', 'face-sad-tear', 'face-angry', 'face-meh', 'face-kiss-wink-heart', 'thumbs-up', 'thumbs-down'] as const
// Stable IDs preserve existing product and navigation configurations.
export const iconNames = ['book', 'rocket', 'code', 'layers', 'file', 'palette', 'globe', 'film', 'users', 'clock', 'folder', 'settings', 'star', 'heart', 'bolt', 'gamepad', 'music', 'camera', 'image', 'lightbulb', 'graduation-cap', 'flask', 'database', 'terminal', 'shield', 'cloud', 'compass', 'map', 'calendar', 'comment', 'bell', 'trophy', 'puzzle-piece', 'cube', 'pen', 'house', ...emojiNames] as const
export type ProductIconName = typeof iconNames[number]
export const iconLabel = (name: string) => name.split('-').map(word => word[0].toUpperCase() + word.slice(1)).join(' ')
