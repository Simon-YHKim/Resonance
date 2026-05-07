/**
 * 상점 화면 — Phase 2 BM.
 *
 * 카탈로그 (잔향가루 / KRW / free) + 인벤토리 + 구매.
 */

import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native';
import { ResonanceApiError } from '@resonance/shared';
import { ActionButton } from '@/components/ActionButton';
import { api } from '@/services/api';

interface ShopItem {
  item_id: string;
  display_name: string;
  description: string;
  category: string;
  currency: string;
  price: number;
  effect: Record<string, unknown>;
}

interface InventoryEntry {
  item_id: string;
  display_name: string;
  category: string;
  quantity: number;
}

const CURRENCY_LABEL: Record<string, string> = {
  resonance_dust: '잔향가루',
  krw: '₩',
  free: '무료',
};

export default function ShopScreen() {
  const [items, setItems] = useState<ShopItem[]>([]);
  const [inventory, setInventory] = useState<InventoryEntry[]>([]);
  const [dust, setDust] = useState(0);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [flash, setFlash] = useState<string | null>(null);

  const reload = async () => {
    setError(null);
    try {
      const [it, inv] = await Promise.all([
        fetch(`${(api as unknown as { config: { baseUrl: string } }).config.baseUrl}/api/shop/items`).then((r) => r.json()),
        fetch(`${(api as unknown as { config: { baseUrl: string } }).config.baseUrl}/api/shop/inventory`, {
          headers: { 'X-Dev-User-Id': 'user_dev_local' },
        }).then((r) => r.json()),
      ]);
      if (it.success) setItems(it.items ?? []);
      if (inv.success) {
        setInventory(inv.items ?? []);
        setDust(inv.resonance_dust ?? 0);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '잔향이 잠시 잦아듭니다.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    reload();
  }, []);

  const purchase = async (itemId: string) => {
    setPurchasing(itemId);
    setError(null);
    try {
      const res = await fetch(
        `${(api as unknown as { config: { baseUrl: string } }).config.baseUrl}/api/shop/purchase`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'X-Dev-User-Id': 'user_dev_local' },
          body: JSON.stringify({ item_id: itemId }),
        },
      );
      const body = await res.json();
      if (!res.ok || !body.success) {
        if (body.code === 'KRW_PAYMENT_NOT_AVAILABLE') {
          setError('실 결제는 곧 열립니다 (Toss 통합 준비 중).');
        } else if (body.code === 'INSUFFICIENT_DUST') {
          setError(`잔향가루가 부족합니다. (${body.have}/${body.need})`);
        } else {
          setError(body.error ?? '구매 실패');
        }
        return;
      }
      setFlash(`${body.item.display_name} — 잔향이 한 번 머물렀어요.`);
      setTimeout(() => setFlash(null), 2000);
      await reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : '잔향이 잠시 잦아듭니다.');
    } finally {
      setPurchasing(null);
    }
  };

  if (loading) {
    return (
      <View className="flex-1 bg-bg-primary items-center justify-center">
        <ActivityIndicator color="#B89DD0" />
      </View>
    );
  }

  return (
    <ScrollView
      className="flex-1 bg-bg-primary"
      contentContainerStyle={{ padding: 24, paddingTop: 48 }}
    >
      <View className="flex-row justify-between items-baseline mb-4">
        <Text className="text-fg-dim text-[10px] tracking-[0.3em] uppercase">상점</Text>
        <Text className="text-fg-muted text-xs">
          잔향가루 <Text className="text-fg-primary text-base">{dust}</Text>
        </Text>
      </View>

      {flash ? (
        <View className="mb-3 border-l-2 border-resonance pl-3 py-2">
          <Text className="text-fg-primary text-sm">{flash}</Text>
        </View>
      ) : null}
      {error ? (
        <View className="mb-3 border-l-2 border-danger pl-3 py-2">
          <Text className="text-danger text-sm">{error}</Text>
        </View>
      ) : null}

      {items.map((it) => (
        <View
          key={it.item_id}
          className="border border-fg-dim/20 rounded-lg p-4 mb-3"
        >
          <Text className="text-fg-primary font-display text-base mb-1">
            {it.display_name}
          </Text>
          <Text className="text-fg-muted text-xs mb-3 leading-relaxed">
            {it.description}
          </Text>
          <View className="flex-row justify-between items-center">
            <Text className="text-fg-dim text-xs">
              {CURRENCY_LABEL[it.currency] ?? it.currency}{' '}
              <Text className="text-fg-primary text-sm">
                {it.currency === 'free' ? '받기' : it.price.toLocaleString()}
              </Text>
            </Text>
            <Pressable
              className="bg-resonance/20 border border-resonance/40 rounded-md px-3 py-1.5"
              onPress={() => purchase(it.item_id)}
              disabled={purchasing === it.item_id}
            >
              <Text className="text-resonance text-xs font-semibold">
                {purchasing === it.item_id ? '...' : '잔향에 새기기'}
              </Text>
            </Pressable>
          </View>
        </View>
      ))}

      {inventory.length > 0 ? (
        <View className="mt-6">
          <Text className="text-fg-dim text-[10px] tracking-[0.3em] uppercase mb-2">
            나의 잔향 — 보유
          </Text>
          {inventory.map((inv) => (
            <View key={inv.item_id} className="flex-row justify-between py-1">
              <Text className="text-fg-primary text-sm">{inv.display_name}</Text>
              <Text className="text-fg-muted text-sm">×{inv.quantity}</Text>
            </View>
          ))}
        </View>
      ) : null}

      <View className="mt-6">
        <ActionButton variant="ghost" onPress={() => router.back()}>
          ← 거리로 돌아가기
        </ActionButton>
      </View>
    </ScrollView>
  );
}
