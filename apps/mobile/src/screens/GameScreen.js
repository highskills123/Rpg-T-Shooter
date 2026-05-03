import React, { useMemo, useRef, useState } from "react";
import { Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from "react-native";

const MAP_WIDTH = 2400;
const MAP_HEIGHT = 2400;
const VIEW_WIDTH = 340;
const VIEW_HEIGHT = 440;
const HERO_SIZE = 48;

const EQUIP_SLOTS = ["Head", "Chest", "Hands", "Legs", "Weapon", "Ring"];
const MAP_SEQUENCE = ["City", "Plains", "Forest"];

const MAP_THEMES = {
  City: {
    bg: "#241b1b",
    tile: "#3a2f2f",
    tileBorder: "#5a4848",
    accent: "#d3b27d"
  },
  Plains: {
    bg: "#1a2316",
    tile: "#27351f",
    tileBorder: "#3b522d",
    accent: "#c4c78a"
  },
  Forest: {
    bg: "#111f18",
    tile: "#1d3227",
    tileBorder: "#31523f",
    accent: "#9bc08d"
  }
};

const START_ITEMS = [
  { id: "i1", name: "Iron Helm", slot: "Head", rarity: "Common" },
  { id: "i2", name: "Ashen Cuirass", slot: "Chest", rarity: "Rare" },
  { id: "i3", name: "Raven Blade", slot: "Weapon", rarity: "Epic" },
  { id: "i4", name: "Bone Ring", slot: "Ring", rarity: "Rare" },
  { id: "i5", name: "Grave Gloves", slot: "Hands", rarity: "Common" },
  { id: "i6", name: "Night Greaves", slot: "Legs", rarity: "Common" }
];

const CORNER_PORTALS = [
  { id: "portal-nw", label: "NW Portal", x: 60, y: 60 },
  { id: "portal-ne", label: "NE Portal", x: MAP_WIDTH - 60, y: 60 },
  { id: "portal-sw", label: "SW Portal", x: 60, y: MAP_HEIGHT - 60 },
  { id: "portal-se", label: "SE Portal", x: MAP_WIDTH - 60, y: MAP_HEIGHT - 60 }
];

function clamp(v, min, max) {
  return Math.max(min, Math.min(max, v));
}

function distance(a, b) {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return Math.sqrt(dx * dx + dy * dy);
}

export default function GameScreen() {
  const [heroPos, setHeroPos] = useState({ x: MAP_WIDTH / 2, y: MAP_HEIGHT / 2 });
  const [activeTab, setActiveTab] = useState("Inventory");
  const [inventory, setInventory] = useState(START_ITEMS);
  const [equipment, setEquipment] = useState({});
  const [draggingItemId, setDraggingItemId] = useState(null);
  const [statusText, setStatusText] = useState("Tap the world to move. Enter a corner portal to change map.");
  const [currentMap, setCurrentMap] = useState("City");
  const lastTapRef = useRef({});

  const camera = useMemo(() => {
    const left = clamp(heroPos.x - VIEW_WIDTH / 2, 0, MAP_WIDTH - VIEW_WIDTH);
    const top = clamp(heroPos.y - VIEW_HEIGHT / 2, 0, MAP_HEIGHT - VIEW_HEIGHT);
    return { left, top };
  }, [heroPos]);

  const mapTheme = MAP_THEMES[currentMap];

  function equipItem(item) {
    const previouslyEquipped = equipment[item.slot];

    setEquipment((current) => ({ ...current, [item.slot]: item }));
    setInventory((current) => {
      const withoutEquippedItem = current.filter((inventoryItem) => inventoryItem.id !== item.id);
      if (!previouslyEquipped) {
        return withoutEquippedItem;
      }
      return [...withoutEquippedItem, previouslyEquipped];
    });

    setStatusText(
      previouslyEquipped
        ? `${item.name} equipped to ${item.slot}. ${previouslyEquipped.name} returned to inventory.`
        : `${item.name} equipped to ${item.slot}.`
    );
  }

  function handleInventoryTap(item) {
    const now = Date.now();
    const previous = lastTapRef.current[item.id] || 0;
    lastTapRef.current[item.id] = now;
    if (now - previous < 300) {
      equipItem(item);
    }
  }

  function handleDrop(slot) {
    if (!draggingItemId) return;
    const dragged = inventory.find((item) => item.id === draggingItemId);
    if (!dragged) return;
    if (dragged.slot !== slot) {
      setStatusText(`${dragged.name} cannot equip to ${slot}.`);
      setDraggingItemId(null);
      return;
    }
    equipItem(dragged);
    setDraggingItemId(null);
  }

  function handlePortalContact(nextPosition) {
    const portal = CORNER_PORTALS.find((candidate) => distance(candidate, nextPosition) <= 70);
    if (!portal) {
      return;
    }
    const currentIndex = MAP_SEQUENCE.indexOf(currentMap);
    const nextMap = MAP_SEQUENCE[(currentIndex + 1) % MAP_SEQUENCE.length];
    setCurrentMap(nextMap);
    setHeroPos({ x: MAP_WIDTH / 2, y: MAP_HEIGHT / 2 });
    setStatusText(`${portal.label} activated. Warped from ${currentMap} to ${nextMap}.`);
  }

  function onMovePress(event) {
    const { locationX, locationY } = event.nativeEvent;
    const targetX = clamp(camera.left + locationX, 0, MAP_WIDTH);
    const targetY = clamp(camera.top + locationY, 0, MAP_HEIGHT);
    const nextPos = { x: targetX, y: targetY };
    setHeroPos(nextPos);
    setStatusText(`[${currentMap}] moved to (${Math.round(targetX)}, ${Math.round(targetY)}).`);
    handlePortalContact(nextPos);
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <Text style={styles.title}>Cathedral of Ash</Text>
        <Text style={[styles.mapLabel, { color: mapTheme.accent }]}>{currentMap}</Text>
        <View style={styles.worldFrame}>
          <Pressable style={styles.worldViewport} onPress={onMovePress}>
            <View
              style={[
                styles.map,
                {
                  width: MAP_WIDTH,
                  height: MAP_HEIGHT,
                  left: -camera.left,
                  top: -camera.top,
                  backgroundColor: mapTheme.bg
                }
              ]}
            >
              {Array.from({ length: 300 }).map((_, index) => (
                <View
                  key={`tile-${index}`}
                  style={[
                    styles.mapTile,
                    {
                      left: (index % 20) * 120,
                      top: Math.floor(index / 20) * 120,
                      backgroundColor: mapTheme.tile,
                      borderColor: mapTheme.tileBorder
                    }
                  ]}
                />
              ))}
              {CORNER_PORTALS.map((portal) => (
                <View key={portal.id} style={[styles.portal, { left: portal.x - 26, top: portal.y - 26, borderColor: mapTheme.accent }]}>
                  <Text style={[styles.portalText, { color: mapTheme.accent }]}>◈</Text>
                </View>
              ))}
              <View style={[styles.hero, { left: heroPos.x - HERO_SIZE / 2, top: heroPos.y - HERO_SIZE / 2 }]}>
                <Text style={styles.heroText}>⚔</Text>
              </View>
            </View>
          </Pressable>
        </View>

        <View style={styles.tabBar}>
          {["Inventory", "Skills", "Stats", "Map", "Options"].map((tab) => (
            <Pressable key={tab} style={[styles.tabBtn, activeTab === tab && styles.tabBtnActive]} onPress={() => setActiveTab(tab)}>
              <Text style={styles.tabText}>{tab}</Text>
            </Pressable>
          ))}
        </View>

        <View style={styles.inventoryPanel}>
          <View style={styles.columnLeft}>
            <Text style={styles.panelTitle}>Equipment</Text>
            {EQUIP_SLOTS.map((slot) => (
              <Pressable key={slot} style={styles.equipSlot} onPress={() => handleDrop(slot)}>
                <Text style={styles.slotLabel}>{slot}</Text>
                <Text style={styles.slotValue}>{equipment[slot]?.name || "(empty)"}</Text>
              </Pressable>
            ))}
          </View>

          <View style={styles.columnMiddle}>
            <Text style={styles.panelTitle}>Hero</Text>
            <View style={styles.heroPortrait}>
              <Text style={styles.heroPortraitText}>🛡</Text>
            </View>
            <Text style={styles.statusText}>{statusText}</Text>
          </View>

          <View style={styles.columnRight}>
            <Text style={styles.panelTitle}>{activeTab}</Text>
            {activeTab === "Inventory" ? (
              <ScrollView style={styles.inventoryList}>
                {inventory.map((item) => (
                  <Pressable
                    key={item.id}
                    style={[styles.inventoryItem, draggingItemId === item.id && styles.inventoryItemDragging]}
                    onPress={() => handleInventoryTap(item)}
                    onLongPress={() => {
                      setDraggingItemId(item.id);
                      setStatusText(`Dragging ${item.name}. Tap equip slot to drop.`);
                    }}
                  >
                    <Text style={styles.itemName}>{item.name}</Text>
                    <Text style={styles.itemMeta}>
                      {item.slot} • {item.rarity}
                    </Text>
                  </Pressable>
                ))}
              </ScrollView>
            ) : (
              <View style={styles.placeholderPane}>
                <Text style={styles.placeholderText}>Gothic {activeTab} panel ready.</Text>
              </View>
            )}
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#0f0a0a" },
  container: { flex: 1, padding: 10 },
  title: { color: "#d2b48c", fontSize: 28, textAlign: "center", marginBottom: 4, fontWeight: "700" },
  mapLabel: { fontSize: 14, textAlign: "center", marginBottom: 6, letterSpacing: 1.2, fontWeight: "700" },
  worldFrame: { borderWidth: 2, borderColor: "#3d2a2a", borderRadius: 10, overflow: "hidden", alignSelf: "center" },
  worldViewport: { width: VIEW_WIDTH, height: VIEW_HEIGHT, backgroundColor: "#1c1212" },
  map: { position: "absolute" },
  mapTile: { position: "absolute", width: 110, height: 110, borderWidth: 1 },
  portal: { position: "absolute", width: 52, height: 52, borderRadius: 26, borderWidth: 2, justifyContent: "center", alignItems: "center", backgroundColor: "rgba(20,20,20,0.45)" },
  portalText: { fontSize: 24, fontWeight: "700" },
  hero: {
    position: "absolute",
    width: HERO_SIZE,
    height: HERO_SIZE,
    borderRadius: 8,
    backgroundColor: "#4f1e1e",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#d2b48c"
  },
  heroText: { color: "#f6e7c6", fontSize: 22 },
  tabBar: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: 10, justifyContent: "center" },
  tabBtn: { paddingHorizontal: 10, paddingVertical: 7, borderRadius: 8, borderWidth: 1, borderColor: "#3b2c2c", backgroundColor: "#170f0f" },
  tabBtnActive: { backgroundColor: "#3b2424", borderColor: "#b08d57" },
  tabText: { color: "#e8d9bd", fontSize: 12 },
  inventoryPanel: { flex: 1, flexDirection: "row", marginTop: 10, gap: 8 },
  columnLeft: { flex: 1.15, backgroundColor: "#150e0e", borderRadius: 10, padding: 8, borderWidth: 1, borderColor: "#382727" },
  columnMiddle: {
    flex: 1,
    backgroundColor: "#120b0b",
    borderRadius: 10,
    padding: 8,
    borderWidth: 1,
    borderColor: "#382727",
    alignItems: "center"
  },
  columnRight: { flex: 1.2, backgroundColor: "#150e0e", borderRadius: 10, padding: 8, borderWidth: 1, borderColor: "#382727" },
  panelTitle: { color: "#cab28b", fontWeight: "700", marginBottom: 8, textAlign: "center" },
  equipSlot: { borderWidth: 1, borderColor: "#493535", borderRadius: 8, padding: 6, marginBottom: 6, backgroundColor: "#211414" },
  slotLabel: { color: "#a28762", fontSize: 12 },
  slotValue: { color: "#efdfc3", fontSize: 12 },
  heroPortrait: {
    width: 100,
    height: 130,
    borderWidth: 1,
    borderColor: "#92734a",
    borderRadius: 12,
    backgroundColor: "#241717",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 10
  },
  heroPortraitText: { fontSize: 40, color: "#e9d9bc" },
  statusText: { color: "#cbb89b", fontSize: 12, textAlign: "center" },
  inventoryList: { flex: 1 },
  inventoryItem: { borderWidth: 1, borderColor: "#4a3636", borderRadius: 8, padding: 8, marginBottom: 6, backgroundColor: "#221515" },
  inventoryItemDragging: { borderColor: "#d0b176", backgroundColor: "#392424" },
  itemName: { color: "#f4e7cb", fontSize: 13, fontWeight: "600" },
  itemMeta: { color: "#bc9d73", fontSize: 11, marginTop: 2 },
  placeholderPane: { flex: 1, justifyContent: "center", alignItems: "center" },
  placeholderText: { color: "#bca27e" }
});
