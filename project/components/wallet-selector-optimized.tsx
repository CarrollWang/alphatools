'use client'

import type {
  DragEndEvent,
} from '@dnd-kit/core'
import type { Hex } from 'viem'
import type { Wallet } from '@/types'
import {
  closestCenter,
  DndContext,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import { restrictToVerticalAxis } from '@dnd-kit/modifiers'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { useAtom } from 'jotai'
import { Check, CheckCheck, Copy, GripVertical, Pencil, Plus, Search, Settings, Trash2, X } from 'lucide-react'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useReducer, useCallback, useMemo } from 'react'
import { isAddress } from 'viem'
import { walletsAtom } from '@/atoms'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/custom-select'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { toast } from '@/components/ui/toast'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { cn, formatAddress, isAddressEqual } from '@/lib/utils'

// 状态接口
interface WalletSelectorState {
  selectedWalletAddress: Hex
  manageOpen: boolean
  newWallet: { address: Hex; label: string }
  editing: { address: Hex; label: string }
  searchTerm: string
  selectOpen: boolean
  copiedAddress: Hex
  isMounted: boolean
}

// 动作类型
type WalletSelectorAction =
  | { type: 'SET_SELECTED_WALLET'; address: Hex }
  | { type: 'TOGGLE_MANAGE_DIALOG'; open?: boolean }
  | { type: 'SET_NEW_WALLET'; wallet: Partial<{ address: Hex; label: string }> }
  | { type: 'SET_EDITING'; editing: Partial<{ address: Hex; label: string }> }
  | { type: 'SET_SEARCH_TERM'; term: string }
  | { type: 'TOGGLE_SELECT'; open?: boolean }
  | { type: 'SET_COPIED_ADDRESS'; address: Hex }
  | { type: 'SET_MOUNTED'; mounted: boolean }
  | { type: 'RESET_NEW_WALLET' }
  | { type: 'RESET_EDITING' }

// 初始状态
const initialState: WalletSelectorState = {
  selectedWalletAddress: '' as Hex,
  manageOpen: false,
  newWallet: { address: '' as Hex, label: '' },
  editing: { address: '' as Hex, label: '' },
  searchTerm: '',
  selectOpen: false,
  copiedAddress: '' as Hex,
  isMounted: false,
}

// Reducer 函数
function walletSelectorReducer(
  state: WalletSelectorState,
  action: WalletSelectorAction
): WalletSelectorState {
  switch (action.type) {
    case 'SET_SELECTED_WALLET':
      return { ...state, selectedWalletAddress: action.address }
    
    case 'TOGGLE_MANAGE_DIALOG':
      return { ...state, manageOpen: action.open ?? !state.manageOpen }
    
    case 'SET_NEW_WALLET':
      return {
        ...state,
        newWallet: { ...state.newWallet, ...action.wallet },
      }
    
    case 'SET_EDITING':
      return {
        ...state,
        editing: { ...state.editing, ...action.editing },
      }
    
    case 'SET_SEARCH_TERM':
      return { ...state, searchTerm: action.term }
    
    case 'TOGGLE_SELECT':
      return { ...state, selectOpen: action.open ?? !state.selectOpen }
    
    case 'SET_COPIED_ADDRESS':
      return { ...state, copiedAddress: action.address }
    
    case 'SET_MOUNTED':
      return { ...state, isMounted: action.mounted }
    
    case 'RESET_NEW_WALLET':
      return { ...state, newWallet: { address: '' as Hex, label: '' } }
    
    case 'RESET_EDITING':
      return { ...state, editing: { address: '' as Hex, label: '' } }
    
    default:
      return state
  }
}

// 可排序的钱包项组件
const SortableWalletItem = React.memo<{
  wallet: Wallet
  editing: { address: Hex; label: string }
  copiedAddress: Hex
  onStartEdit: (wallet: Wallet) => void
  onSaveEdit: () => void
  onCancelEdit: () => void
  onDelete: (address: Hex) => void
  onCopy: (address: Hex) => void
  onEditLabelChange: (label: string) => void
}>(({
  wallet,
  editing,
  copiedAddress,
  onStartEdit,
  onSaveEdit,
  onCancelEdit,
  onDelete,
  onCopy,
  onEditLabelChange,
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: wallet.address })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  const isEditing = editing.address === wallet.address
  const isCopied = copiedAddress === wallet.address

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'flex items-center justify-between rounded-lg border border-border bg-card p-3',
        isDragging && 'bg-muted/50',
      )}
    >
      <div className="flex items-center space-x-3">
        <div
          {...attributes}
          {...listeners}
          className="cursor-grab text-muted-foreground hover:text-foreground"
        >
          <GripVertical className="h-4 w-4" />
        </div>
        
        <div className="flex-1 min-w-0">
          {isEditing ? (
            <div className="flex items-center space-x-2">
              <Input
                value={editing.label}
                onChange={(e) => onEditLabelChange(e.target.value)}
                className="h-8"
                placeholder="钱包标签"
                autoFocus
              />
              <Button size="sm" onClick={onSaveEdit}>
                <Check className="h-3 w-3" />
              </Button>
              <Button size="sm" variant="ghost" onClick={onCancelEdit}>
                <X className="h-3 w-3" />
              </Button>
            </div>
          ) : (
            <div>
              <p className="font-medium text-sm">{wallet.label}</p>
              <p className="text-xs text-muted-foreground font-mono">
                {formatAddress(wallet.address)}
              </p>
            </div>
          )}
        </div>
      </div>

      {!isEditing && (
        <div className="flex items-center space-x-1">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onCopy(wallet.address)}
                  className="h-8 w-8 p-0"
                >
                  {isCopied ? (
                    <CheckCheck className="h-3 w-3 text-green-500" />
                  ) : (
                    <Copy className="h-3 w-3" />
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>{isCopied ? '已复制' : '复制地址'}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onStartEdit(wallet)}
                  className="h-8 w-8 p-0"
                >
                  <Pencil className="h-3 w-3" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>编辑标签</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onDelete(wallet.address)}
                  className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>删除钱包</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      )}
    </div>
  )
})

SortableWalletItem.displayName = 'SortableWalletItem'

// 添加钱包表单组件
const AddWalletForm = React.memo<{
  newWallet: { address: Hex; label: string }
  onWalletChange: (wallet: Partial<{ address: Hex; label: string }>) => void
  onAdd: () => void
  onReset: () => void
}>(({ newWallet, onWalletChange, onAdd, onReset }) => {
  const handleAddWallet = useCallback(() => {
    if (!newWallet.address || !isAddress(newWallet.address)) {
      toast({
        title: '请输入有效的钱包地址',
        variant: 'destructive',
      })
      return
    }

    if (!newWallet.label.trim()) {
      toast({
        title: '请输入钱包标签',
        variant: 'destructive',
      })
      return
    }

    onAdd()
  }, [newWallet, onAdd])

  return (
    <div className="space-y-4">
      <div>
        <label className="text-sm font-medium">钱包地址</label>
        <Input
          placeholder="0x..."
          value={newWallet.address}
          onChange={(e) => onWalletChange({ address: e.target.value as Hex })}
          className="mt-1"
        />
      </div>
      <div>
        <label className="text-sm font-medium">钱包标签</label>
        <Input
          placeholder="给钱包起个名字"
          value={newWallet.label}
          onChange={(e) => onWalletChange({ label: e.target.value })}
          className="mt-1"
        />
      </div>
      <div className="flex space-x-2">
        <Button onClick={handleAddWallet} className="flex-1">
          <Plus className="h-4 w-4 mr-2" />
          添加钱包
        </Button>
        <Button variant="outline" onClick={onReset}>
          重置
        </Button>
      </div>
    </div>
  )
})

AddWalletForm.displayName = 'AddWalletForm'

export default function WalletSelector() {
  const [state, dispatch] = useReducer(walletSelectorReducer, initialState)
  const [wallets, setWallets] = useAtom(walletsAtom)
  const router = useRouter()
  const pathname = usePathname()

  // 传感器配置
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  // 过滤后的钱包列表 - 使用 memoization
  const filteredWallets = useMemo(() => {
    if (!state.searchTerm) return wallets
    const term = state.searchTerm.toLowerCase()
    return wallets.filter(wallet =>
      wallet.label.toLowerCase().includes(term) ||
      wallet.address.toLowerCase().includes(term)
    )
  }, [wallets, state.searchTerm])

  // 当前选中的钱包
  const currentWallet = useMemo(() => {
    if (!state.isMounted) return null
    return wallets.find(wallet => 
      isAddressEqual(wallet.address, state.selectedWalletAddress)
    )
  }, [wallets, state.selectedWalletAddress, state.isMounted])

  // 初始化和路径同步
  useEffect(() => {
    dispatch({ type: 'SET_MOUNTED', mounted: true })
    
    const addressFromPath = pathname.split('/').pop()
    if (addressFromPath && isAddress(addressFromPath)) {
      dispatch({ type: 'SET_SELECTED_WALLET', address: addressFromPath as Hex })
    } else if (wallets.length > 0) {
      dispatch({ type: 'SET_SELECTED_WALLET', address: wallets[0].address })
    }
  }, [pathname, wallets])

  // 回调函数 - 使用 useCallback 优化性能
  const handleWalletSelect = useCallback((address: Hex) => {
    dispatch({ type: 'SET_SELECTED_WALLET', address })
    dispatch({ type: 'TOGGLE_SELECT', open: false })
    router.push(`/${address}`)
  }, [router])

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event
    if (over && active.id !== over.id) {
      setWallets(items => {
        const oldIndex = items.findIndex(item => item.address === active.id)
        const newIndex = items.findIndex(item => item.address === over.id)
        return arrayMove(items, oldIndex, newIndex)
      })
    }
  }, [setWallets])

  const handleAddWallet = useCallback(() => {
    const existingWallet = wallets.find(w => 
      isAddressEqual(w.address, state.newWallet.address)
    )
    
    if (existingWallet) {
      toast({
        title: '钱包已存在',
        description: '该地址已在钱包列表中',
        variant: 'destructive',
      })
      return
    }

    const newWallet: Wallet = {
      address: state.newWallet.address,
      label: state.newWallet.label,
    }

    setWallets(prev => [...prev, newWallet])
    dispatch({ type: 'RESET_NEW_WALLET' })
    
    toast({
      title: '钱包添加成功',
      description: `已添加钱包：${state.newWallet.label}`,
    })
  }, [wallets, state.newWallet, setWallets])

  const handleStartInlineEdit = useCallback((wallet: Wallet) => {
    dispatch({ 
      type: 'SET_EDITING', 
      editing: { address: wallet.address, label: wallet.label } 
    })
  }, [])

  const handleSaveInlineEdit = useCallback(() => {
    if (!state.editing.label.trim()) return

    setWallets(prev =>
      prev.map(wallet =>
        wallet.address === state.editing.address
          ? { ...wallet, label: state.editing.label }
          : wallet
      )
    )
    
    dispatch({ type: 'RESET_EDITING' })
    toast({
      title: '标签更新成功',
    })
  }, [state.editing, setWallets])

  const handleCancelInlineEdit = useCallback(() => {
    dispatch({ type: 'RESET_EDITING' })
  }, [])

  const handleDeleteWallet = useCallback((address: Hex) => {
    setWallets(prev => prev.filter(wallet => wallet.address !== address))
    
    if (isAddressEqual(address, state.selectedWalletAddress)) {
      const remainingWallets = wallets.filter(w => !isAddressEqual(w.address, address))
      if (remainingWallets.length > 0) {
        handleWalletSelect(remainingWallets[0].address)
      } else {
        router.push('/')
      }
    }
    
    toast({
      title: '钱包删除成功',
    })
  }, [wallets, state.selectedWalletAddress, setWallets, handleWalletSelect, router])

  const copyToClipboard = useCallback(async (address: Hex) => {
    try {
      await navigator.clipboard.writeText(address)
      dispatch({ type: 'SET_COPIED_ADDRESS', address })
      
      toast({
        title: '地址已复制',
      })
      
      setTimeout(() => {
        dispatch({ type: 'SET_COPIED_ADDRESS', address: '' as Hex })
      }, 2000)
    } catch (error) {
      // 回退方案
      const textArea = document.createElement('textarea')
      textArea.value = address
      document.body.appendChild(textArea)
      textArea.select()
      document.execCommand('copy')
      document.body.removeChild(textArea)
      
      dispatch({ type: 'SET_COPIED_ADDRESS', address })
      toast({ title: '地址已复制' })
      
      setTimeout(() => {
        dispatch({ type: 'SET_COPIED_ADDRESS', address: '' as Hex })
      }, 2000)
    }
  }, [])

  // 键盘快捷键
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (state.editing.address) {
          handleCancelInlineEdit()
        } else if (state.selectOpen) {
          dispatch({ type: 'TOGGLE_SELECT', open: false })
        } else if (state.manageOpen) {
          dispatch({ type: 'TOGGLE_MANAGE_DIALOG', open: false })
        }
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [state.editing.address, state.selectOpen, state.manageOpen, handleCancelInlineEdit])

  if (!state.isMounted) {
    return (
      <Select disabled>
        <SelectTrigger className="w-full">
          <SelectValue placeholder="加载中..." />
        </SelectTrigger>
      </Select>
    )
  }

  return (
    <>
      <Select
        open={state.selectOpen}
        onOpenChange={(open) => dispatch({ type: 'TOGGLE_SELECT', open })}
        value={state.selectedWalletAddress}
        onValueChange={handleWalletSelect}
      >
        <SelectTrigger className="w-full">
          <SelectValue placeholder="选择钱包">
            {currentWallet && (
              <div className="flex items-center justify-between w-full">
                <span className="truncate">{currentWallet.label}</span>
                <span className="text-xs text-muted-foreground font-mono ml-2">
                  {formatAddress(currentWallet.address)}
                </span>
              </div>
            )}
          </SelectValue>
        </SelectTrigger>
        
        <SelectContent>
          <div className="p-2">
            <div className="flex items-center space-x-2 mb-2">
              <div className="relative flex-1">
                <Search className="absolute left-2 top-1/2 h-3 w-3 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="搜索钱包..."
                  value={state.searchTerm}
                  onChange={(e) => dispatch({ type: 'SET_SEARCH_TERM', term: e.target.value })}
                  className="h-8 pl-7"
                />
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => dispatch({ type: 'TOGGLE_MANAGE_DIALOG', open: true })}
                className="h-8"
              >
                <Settings className="h-3 w-3" />
              </Button>
            </div>
          </div>
          
          {filteredWallets.length === 0 ? (
            <div className="p-4 text-center text-sm text-muted-foreground">
              {state.searchTerm ? '未找到匹配的钱包' : '暂无钱包'}
            </div>
          ) : (
            <ScrollArea className="max-h-64">
              {filteredWallets.map(wallet => (
                <SelectItem
                  key={wallet.address}
                  value={wallet.address}
                  className="cursor-pointer"
                >
                  <div className="flex items-center justify-between w-full">
                    <span className="truncate">{wallet.label}</span>
                    <span className="text-xs text-muted-foreground font-mono ml-2">
                      {formatAddress(wallet.address)}
                    </span>
                  </div>
                </SelectItem>
              ))}
            </ScrollArea>
          )}
        </SelectContent>
      </Select>

      {/* 钱包管理弹窗 */}
      <Dialog
        open={state.manageOpen}
        onOpenChange={(open) => dispatch({ type: 'TOGGLE_MANAGE_DIALOG', open })}
      >
        <DialogContent className="max-w-2xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>钱包管理</DialogTitle>
            <DialogDescription>
              管理你的钱包地址，可以拖拽排序
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* 钱包列表 */}
            <div>
              <h3 className="font-medium mb-3">钱包列表 ({wallets.length})</h3>
              {wallets.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <p>还没有添加任何钱包</p>
                  <p className="text-sm mt-1">在右侧添加第一个钱包</p>
                </div>
              ) : (
                <ScrollArea className="h-96">
                  <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragEnd={handleDragEnd}
                    modifiers={[restrictToVerticalAxis]}
                  >
                    <SortableContext
                      items={wallets.map(w => w.address)}
                      strategy={verticalListSortingStrategy}
                    >
                      <div className="space-y-2">
                        {wallets.map(wallet => (
                          <SortableWalletItem
                            key={wallet.address}
                            wallet={wallet}
                            editing={state.editing}
                            copiedAddress={state.copiedAddress}
                            onStartEdit={handleStartInlineEdit}
                            onSaveEdit={handleSaveInlineEdit}
                            onCancelEdit={handleCancelInlineEdit}
                            onDelete={handleDeleteWallet}
                            onCopy={copyToClipboard}
                            onEditLabelChange={(label) => 
                              dispatch({ type: 'SET_EDITING', editing: { ...state.editing, label } })
                            }
                          />
                        ))}
                      </div>
                    </SortableContext>
                  </DndContext>
                </ScrollArea>
              )}
            </div>

            {/* 添加钱包表单 */}
            <div>
              <h3 className="font-medium mb-3">添加新钱包</h3>
              <AddWalletForm
                newWallet={state.newWallet}
                onWalletChange={(wallet) => dispatch({ type: 'SET_NEW_WALLET', wallet })}
                onAdd={handleAddWallet}
                onReset={() => dispatch({ type: 'RESET_NEW_WALLET' })}
              />
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}