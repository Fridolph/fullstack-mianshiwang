<script setup lang="ts">
import type { TableColumn, DropdownMenuItem } from '@nuxt/ui'

// import { mainList, secList, thirdList, decList, subtractList } from './mockData'
interface User {
  id: number
  name: string
  position: string
  email: string
  role: string
}

const toast = useToast()
const { copy } = useClipboard()

const tableData = ref([
  {
    id: 1,
    name: 'Lindsay Walton',
    position: 'Front-end Developer',
    email: 'lindsay.walton@example.com',
    role: 'Member'
  },
  {
    id: 2,
    name: 'Courtney Henry',
    position: 'Designer',
    email: 'courtney.henry@example.com',
    role: 'Admin'
  },
  {
    id: 3,
    name: 'Tom Cook',
    position: 'Director of Product',
    email: 'tom.cook@example.com',
    role: 'Member'
  },
  {
    id: 4,
    name: 'Whitney Francis',
    position: 'Copywriter',
    email: 'whitney.francis@example.com',
    role: 'Admin'
  },
  {
    id: 5,
    name: 'Leonard Krasner',
    position: 'Senior Designer',
    email: 'leonard.krasner@example.com',
    role: 'Owner'
  },
  {
    id: 6,
    name: 'Floyd Miles',
    position: 'Principal Designer',
    email: 'floyd.miles@example.com',
    role: 'Member'
  }
])

const columns: TableColumn<User>[] = [
  {
    accessorKey: 'id',
    header: 'ID'
  },
  {
    accessorKey: 'name',
    header: 'Name'
  },
  {
    accessorKey: 'email',
    header: 'Email'
  },
  {
    accessorKey: 'role',
    header: 'Role'
  },
  {
    id: 'action'
  }
]

// 错误状态
const hasError = ref(false)
const handleError = (error: Error | null) => {
  hasError.value = !!error
}

function getDropdownActions(user: User): DropdownMenuItem[][] {
  return [
    [
      {
        label: 'Copy user Id',
        icon: 'i-lucide-copy',
        onSelect: () => {
          copy(user.id.toString())

          toast.add({
            title: 'User ID copied to clipboard!',
            color: 'success',
            icon: 'i-lucide-circle-check'
          })
        }
      }
    ],
    [
      {
        label: 'Edit',
        icon: 'i-lucide-edit'
      },
      {
        label: 'Delete',
        icon: 'i-lucide-trash',
        color: 'error'
      }
    ]
  ]
}
</script>

<template>
  <NuxtLayout name="uicomp" layout-class="flex flex-col gap-4">
    <h1 class="text-2xl font-bold mb-6">
      JSON编辑器示例
    </h1>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <!-- 编辑器区域 -->
      <div>
        <h2 class="text-xl font-semibold mb-4">
          编辑 data 数据 （JSON）
        </h2>
        <JsonEditor
          v-model="tableData"
          title="商品列表 数据"
          description="编辑商品列表数据，格式必须是有效的JSON数组"
          height="400px"
          @error="handleError"
        />
      </div>

      <!-- 预览区域 -->
      <div>
        <h2 class="text-xl font-semibold mb-4">
          数据预览
        </h2>

        <div class="flex flex-col items-center justify-between">
          <UBadge v-if="hasError" color="error">
            数据格式错误
          </UBadge>

          <UTable :data="tableData" :columns="columns" class="flex-1">
            <template #name-cell="{ row }">
              <div class="flex items-center gap-3">
                <UAvatar
                  :src="`https://i.pravatar.cc/120?img=${row.original.id}`"
                  size="lg"
                  :alt="`${row.original.name} avatar`"
                />
                <div>
                  <p class="font-medium text-highlighted">
                    {{ row.original.name }}
                  </p>
                  <p>
                    {{ row.original.position }}
                  </p>
                </div>
              </div>
            </template>
            <template #action-cell="{ row }">
              <UDropdownMenu :items="getDropdownActions(row.original)">
                <UButton
                  icon="i-lucide-ellipsis-vertical"
                  color="neutral"
                  variant="ghost"
                  aria-label="Actions"
                />
              </UDropdownMenu>
            </template>
          </UTable>
        </div>
      </div>
    </div>
  </nuxtlayout>
</template>
