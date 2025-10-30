import { MoreHorizontal } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

export interface ActionMenuAction {
  label: string
  onSelect: () => void
  destructive?: boolean
  disabled?: boolean
}

export interface ActionMenuGroup {
  label?: string
  actions: ActionMenuAction[]
}

export interface ActionMenuProps {
  groups: ActionMenuGroup[]
  triggerLabel?: string
  disabled?: boolean
}

export function ActionMenu({
  groups,
  triggerLabel,
  disabled,
}: ActionMenuProps) {
  const hasVisibleActions = groups.some((group) =>
    group.actions.some((action) => !action.disabled)
  )

  if (!hasVisibleActions) {
    return null
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant='ghost'
          size='icon'
          className='h-8 w-8'
          disabled={disabled}
          aria-label={triggerLabel || '操作菜单'}
        >
          <MoreHorizontal className='h-4 w-4' />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align='end'>
        {groups.map((group, groupIndex) => (
          <div key={groupIndex}>
            {group.label && (
              <>
                <DropdownMenuLabel>{group.label}</DropdownMenuLabel>
                {groupIndex > 0 && <DropdownMenuSeparator />}
              </>
            )}
            {group.actions.map(
              (action, actionIndex) =>
                !action.disabled && (
                  <DropdownMenuItem
                    key={actionIndex}
                    onSelect={action.onSelect}
                    className={
                      action.destructive
                        ? 'text-destructive focus:text-destructive'
                        : ''
                    }
                  >
                    {action.label}
                  </DropdownMenuItem>
                )
            )}
            {groupIndex < groups.length - 1 &&
              group.actions.some((action) => !action.disabled) && (
                <DropdownMenuSeparator />
              )}
          </div>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
