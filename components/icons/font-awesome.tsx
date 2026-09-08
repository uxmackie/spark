'use client'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { config, type IconDefinition } from '@fortawesome/fontawesome-svg-core'
import * as fa from '@fortawesome/free-solid-svg-icons'
import type { CSSProperties } from 'react'
config.autoAddCss = false

type Props = { className?: string; size?: number | string; strokeWidth?: number; style?: CSSProperties; 'aria-label'?: string; 'aria-hidden'?: boolean | 'true' | 'false' }
function icon(definition: IconDefinition) {
  return function Icon({ size, strokeWidth: _strokeWidth, style, ...props }: Props) {
    return <FontAwesomeIcon icon={definition} {...props} style={{ ...(size ? { width: size, height: size } : {}), ...style }} />
  }
}
export const ArrowDown = icon(fa.faArrowDown), ArrowUp = icon(fa.faArrowUp), ArrowLeft = icon(fa.faArrowLeft), ArrowRight = icon(fa.faArrowRight), ArrowUpRight = icon(fa.faArrowUpRightFromSquare)
export const BookOpen = icon(fa.faBookOpen), Check = icon(fa.faCheck), ChevronRight = icon(fa.faChevronRight), ChevronDown = icon(fa.faChevronDown), Code2 = icon(fa.faCode), Copy = icon(fa.faCopy), Download = icon(fa.faDownload), Eye = icon(fa.faEye)
export const FileText = icon(fa.faFileLines), Folder = icon(fa.faFolder), LayoutTemplate = icon(fa.faTableColumns), Menu = icon(fa.faBars), MoreHorizontal = icon(fa.faEllipsis), Pencil = icon(fa.faPen), Plus = icon(fa.faPlus), Redo2 = icon(fa.faRotateRight), Save = icon(fa.faFloppyDisk), Search = icon(fa.faMagnifyingGlass), Settings2 = icon(fa.faGear), Sparkles = icon(fa.faWandMagicSparkles), Trash2 = icon(fa.faTrashCan), Undo2 = icon(fa.faRotateLeft), X = icon(fa.faXmark)
export const Asterisk = icon(fa.faAsterisk), Lightbulb = icon(fa.faLightbulb), Moon = icon(fa.faMoon), Sun = icon(fa.faSun), List = icon(fa.faList), Command = icon(fa.faKeyboard), Braces = icon(fa.faCode), FolderGit2 = icon(fa.faFolderTree), Palette = icon(fa.faPalette), Rocket = icon(fa.faRocket)
export const Info = icon(fa.faCircleInfo), TriangleAlert = icon(fa.faTriangleExclamation), CircleCheck = icon(fa.faCircleCheck), OctagonAlert = icon(fa.faCircleExclamation)
export const GripVertical = icon(fa.faGripVertical)
