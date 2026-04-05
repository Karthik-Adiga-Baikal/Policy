import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";

export interface PolicyBlock {
  id: string;
  policyId: string;
  type: string;
  label?: string;
  orderIndex: number;
  content: Record<string, any>;
  numericValue?: number | null;
  operator?: string | null;
  parentId?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateBlockInput {
  policyId: string;
  type: string;
  label?: string;
  content: Record<string, any>;
  orderIndex: number;
  parentId?: string;
}

export interface UpdateBlockInput {
  type?: string;
  label?: string;
  content?: Record<string, any>;
  orderIndex?: number;
  parentId?: string | null;
}

/**
 * Fetch all blocks for a policy
 */
export const useBlocks = (policyId: string | null) => {
  return useQuery({
    queryKey: ["blocks", policyId],
    queryFn: async () => {
      if (!policyId) return [];
      const { data } = await api.get(`/block/get-all?policyId=${policyId}`);
      return (data.data || []) as PolicyBlock[];
    },
    enabled: !!policyId,
    refetchInterval: 2000,
  });
};

/**
 * Create a single block
 */
export const useCreateBlock = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateBlockInput) => {
      const { data } = await api.post("/block/create", input);
      return data.data as PolicyBlock;
    },
    onSuccess: (newBlock) => {
      queryClient.invalidateQueries({ queryKey: ["blocks", newBlock.policyId] });
    },
  });
};

/**
 * Update a block
 */
export const useUpdateBlock = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ blockId, ...input }: UpdateBlockInput & { blockId: string }) => {
      const { data } = await api.patch(`/block/${blockId}`, input);
      return data.data as PolicyBlock;
    },
    onSuccess: (updatedBlock) => {
      queryClient.invalidateQueries({ queryKey: ["blocks", updatedBlock.policyId] });
    },
  });
};

/**
 * Delete a block
 */
export const useDeleteBlock = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (blockId: string) => {
      await api.delete(`/block/${blockId}`);
      return blockId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["blocks"] });
    },
  });
};

/**
 * Reorder blocks (bulk update orderIndex)
 */
export const useReorderBlocks = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: { blocks: Array<{ id: string; orderIndex: number }> }) => {
      const { data } = await api.patch("/block/reorder", input);
      return data.data as PolicyBlock[];
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["blocks"] });
    },
  });
};

/**
 * Bulk create blocks (for AI import)
 */
export const useBulkCreateBlocks = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: { policyId: string; blocks: Omit<CreateBlockInput, "policyId">[] }) => {
      const { data } = await api.post("/block/bulk-create", {
        policyId: input.policyId,
        blocks: input.blocks,
      });
      return data.data as PolicyBlock[];
    },
    onSuccess: (blocks) => {
      if (blocks.length > 0) {
        queryClient.invalidateQueries({ queryKey: ["blocks", blocks[0].policyId] });
      }
    },
  });
};
