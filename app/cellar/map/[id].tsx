import { useEffect, useState, useRef, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions, Platform, LayoutChangeEvent, NativeSyntheticEvent, NativeScrollEvent } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { useCellarStore } from '../../../src/store/cellarStore';
import { useWineStore } from '../../../src/store/wineStore';
import { fetchCellar, fetchWinesInCellar, updateWinePosition } from '../../../src/services/cellarApi';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Wine } from '../../../src/types/wine';
import { columnToLetter, rowToDisplay, formatCellarPosition } from '../../../src/utils/cellarHelpers';

const CELL_SIZE = 50;
const CELL_MARGIN = 2;

export default function CellarMapScreen() {
  const { id, highlight, moveWineId } = useLocalSearchParams();
  const cellars = useCellarStore((state) => state.cellars);
  const wines = useWineStore((state) => state.wines);
  const [cellar, setCellar] = useState(cellars.find((c) => c.id === id));
  const [cellarWines, setCellarWines] = useState<Wine[]>([]);
  const [selectedPosition, setSelectedPosition] = useState<{ row: number; column: number } | null>(null);
  const [highlightedPosition, setHighlightedPosition] = useState<{ row: number; column: number } | null>(null);
  const [selectedWineForMove, setSelectedWineForMove] = useState<Wine | null>(null);
  const [showCellarSelector, setShowCellarSelector] = useState(false);

  // ドラッグ&ドロップ状態
  const [isDragging, setIsDragging] = useState(false);
  const [draggedWine, setDraggedWine] = useState<Wine | null>(null);
  const [dragOrigin, setDragOrigin] = useState<{ row: number; column: number } | null>(null);
  const [hoverCell, setHoverCell] = useState<{ row: number; column: number } | null>(null);
  const [gridLayout, setGridLayout] = useState<{ x: number; y: number; width: number; height: number } | null>(null);
  const [scrollPosition, setScrollPosition] = useState({ x: 0, y: 0 });

  // ドラッグ&ドロップ用のRef
  const longPressTimer = useRef<NodeJS.Timeout | null>(null);
  const scrollViewRef = useRef<ScrollView>(null);
  const gridRef = useRef<View>(null);

  useEffect(() => {
    loadCellarData();

    // Parse highlight parameter
    if (highlight) {
      const [row, column] = (highlight as string).split('-').map(Number);
      if (!isNaN(row) && !isNaN(column)) {
        setHighlightedPosition({ row, column });
        setSelectedPosition({ row, column });
      }
    }

    // 別のセラーから移動してきた場合
    if (moveWineId) {
      const wine = wines.find((w) => w.id === moveWineId);
      if (wine) {
        setSelectedWineForMove(wine);
      }
    }
  }, [id, highlight, moveWineId]);

  // Reload data when wines in store change
  useEffect(() => {
    loadCellarData();
  }, [wines]);

  const loadCellarData = async () => {
    try {
      const cellarData = await fetchCellar(id as string);
      if (cellarData) {
        setCellar(cellarData);
      }
      const winesData = await fetchWinesInCellar(id as string);
      setCellarWines(winesData);
      setSelectedPosition(null); // Clear selection after reload
    } catch (error) {
      console.error('Error loading cellar:', error);
    }
  };

  if (!cellar) {
    return (
      <View style={styles.container}>
        <Text>セラーが見つかりません</Text>
      </View>
    );
  }

  // Create a map of positions to wines
  const positionMap: Record<string, Wine> = {};
  cellarWines.forEach((wine) => {
    if (wine.position_row !== null && wine.position_column !== null) {
      const key = `${wine.position_row}-${wine.position_column}`;
      positionMap[key] = wine;
    }
  });

  // ドラッグ状態をリセット
  const resetDragState = useCallback(() => {
    setIsDragging(false);
    setDraggedWine(null);
    setDragOrigin(null);
    setHoverCell(null);
  }, []);

  // 座標からセルを計算
  const getCellFromPosition = useCallback((pageX: number, pageY: number): { row: number; column: number } | null => {
    if (!gridLayout || !cellar) return null;

    // グリッド内の相対座標を計算
    const relativeX = pageX - gridLayout.x + scrollPosition.x;
    const relativeY = pageY - gridLayout.y + scrollPosition.y;

    // 列・行ラベル分のオフセットを引く
    const cellAreaX = relativeX - CELL_SIZE;
    const cellAreaY = relativeY - CELL_SIZE;

    if (cellAreaX < 0 || cellAreaY < 0) return null;

    // セルサイズ（50 + 2*2マージン）で割る
    const cellTotalSize = CELL_SIZE + CELL_MARGIN * 2;
    const column = Math.floor(cellAreaX / cellTotalSize);
    const row = Math.floor(cellAreaY / cellTotalSize);

    // 範囲外チェック
    if (row < 0 || row >= cellar.rows || column < 0 || column >= cellar.columns) {
      return null;
    }

    return { row, column };
  }, [gridLayout, scrollPosition, cellar?.rows, cellar?.columns]);

  // ドロップ処理
  const handleDragEnd = useCallback(async () => {
    if (!isDragging || !draggedWine || !dragOrigin) {
      resetDragState();
      return;
    }

    // セラー外にドロップした場合
    if (!hoverCell) {
      alert('ドラッグをキャンセルしました');
      resetDragState();
      return;
    }

    // 同じセルにドロップした場合
    if (hoverCell.row === dragOrigin.row && hoverCell.column === dragOrigin.column) {
      resetDragState();
      return;
    }

    // ホバー先のセルをチェック
    const key = `${hoverCell.row}-${hoverCell.column}`;
    const targetWine = positionMap[key];

    if (targetWine) {
      alert('このセルには既にワインがあります');
      resetDragState();
      return;
    }

    // 空きセルにドロップ → ワインを移動
    try {
      await updateWinePosition(
        draggedWine.id,
        cellar.id,
        hoverCell.row,
        hoverCell.column
      );

      await loadCellarData();
      alert('ワインを移動しました');
    } catch (error) {
      console.error('Error moving wine:', error);
      alert('ワインの移動に失敗しました');
      await loadCellarData(); // エラー時も状態を同期
    } finally {
      resetDragState();
    }
  }, [isDragging, draggedWine, dragOrigin, hoverCell, positionMap, cellar, resetDragState]);

  // Escキーでドラッグをキャンセル（Web）+ グローバルマウスイベント
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isDragging) {
        alert('ドラッグをキャンセルしました');
        resetDragState();
      }
    };

    const handleGlobalMouseMove = (event: MouseEvent) => {
      if (!isDragging || !gridLayout) return;

      const pageX = event.clientX;
      const pageY = event.clientY;

      const cell = getCellFromPosition(pageX, pageY);

      if (cell && (cell.row !== hoverCell?.row || cell.column !== hoverCell?.column)) {
        setHoverCell(cell);
      }
    };

    const handleGlobalMouseUp = () => {
      if (isDragging) {
        handleDragEnd();
      }
    };

    if (Platform.OS === 'web') {
      window.addEventListener('keydown', handleKeyDown);
      window.addEventListener('mousemove', handleGlobalMouseMove);
      window.addEventListener('mouseup', handleGlobalMouseUp);

      return () => {
        window.removeEventListener('keydown', handleKeyDown);
        window.removeEventListener('mousemove', handleGlobalMouseMove);
        window.removeEventListener('mouseup', handleGlobalMouseUp);
      };
    }
  }, [isDragging, gridLayout, hoverCell, getCellFromPosition, resetDragState, handleDragEnd]);

  // 長押し開始
  const handleCellPressIn = (wine: Wine | undefined, row: number, column: number) => {
    longPressTimer.current = setTimeout(() => {
      if (wine) {
        handleDragStart(wine, row, column);
      }
    }, 300); // 300ms長押しでドラッグ開始
  };

  // 長押し終了
  const handleCellPressOut = (wine: Wine | undefined, row: number, column: number) => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;

      // 長押しではなかった → 通常のクリック処理
      if (!isDragging) {
        handleCellPress(row, column);
      }
    }
  };

  // ドラッグ開始
  const handleDragStart = (wine: Wine, row: number, column: number) => {
    setIsDragging(true);
    setDraggedWine(wine);
    setDragOrigin({ row, column });
    setSelectedWineForMove(null); // 既存の選択状態をクリア
  };

  // ドラッグ移動中
  const handleDragMove = useCallback((event: any) => {
    if (!isDragging) return;

    // タッチイベントとマウスイベントの両方に対応
    let pageX, pageY;

    if (event.nativeEvent.touches && event.nativeEvent.touches.length > 0) {
      // タッチイベント（モバイル）
      pageX = event.nativeEvent.touches[0].pageX;
      pageY = event.nativeEvent.touches[0].pageY;
    } else if (event.nativeEvent.pageX !== undefined && event.nativeEvent.pageY !== undefined) {
      // マウスイベント（Web）
      pageX = event.nativeEvent.pageX;
      pageY = event.nativeEvent.pageY;
    } else if (Platform.OS === 'web' && event.nativeEvent.clientX !== undefined) {
      // Web環境のマウスイベント（clientX/Y を使用）
      pageX = event.nativeEvent.clientX;
      pageY = event.nativeEvent.clientY;
    }

    if (!pageX || !pageY) return;

    const cell = getCellFromPosition(pageX, pageY);

    if (cell && (cell.row !== hoverCell?.row || cell.column !== hoverCell?.column)) {
      setHoverCell(cell);
    }
  }, [isDragging, getCellFromPosition, hoverCell]);

  // グリッドレイアウト取得
  const handleGridLayout = (event: LayoutChangeEvent) => {
    const { width, height } = event.nativeEvent.layout;

    // Webの場合、getBoundingClientRectを使用
    if (Platform.OS === 'web' && gridRef.current) {
      const element = gridRef.current as any;
      if (element.getBoundingClientRect) {
        const rect = element.getBoundingClientRect();
        setGridLayout({ x: rect.left, y: rect.top, width: rect.width, height: rect.height });
        return;
      }
    }

    // ネイティブの場合、measureを使用
    if (gridRef.current) {
      (gridRef.current as any).measure((x: number, y: number, w: number, h: number, pageX: number, pageY: number) => {
        setGridLayout({ x: pageX, y: pageY, width: w, height: h });
      });
    }
  };

  // スクロール位置取得
  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    setScrollPosition({
      x: event.nativeEvent.contentOffset.x,
      y: event.nativeEvent.contentOffset.y,
    });
  };

  const handleCellPress = (row: number, column: number) => {
    if (isDragging) return; // ドラッグ中はクリック無効

    const key = `${row}-${column}`;
    const wine = positionMap[key];

    // 移動モードの場合
    if (selectedWineForMove) {
      if (wine) {
        // 既存ワインのセル → 移動不可、警告表示
        alert('このセルには既にワインがあります');
      } else {
        // 空きセル → ワインを移動
        handleMoveWine(row, column);
      }
      return;
    }

    // 通常モード
    if (wine) {
      // ワインセル → 選択して移動 or 詳細を選択
      setSelectedWineForMove(wine);
      setSelectedPosition({ row, column });
    } else {
      // 空きセル → ワイン追加モーダル
      setSelectedPosition({ row, column });
    }
  };

  const handleAddWineHere = () => {
    if (selectedPosition) {
      router.push({
        pathname: '/cellar/add-wine/[id]' as any,
        params: {
          id: cellar.id,
          row: selectedPosition.row,
          column: selectedPosition.column,
        },
      });
    }
  };

  const handleMoveWine = async (targetRow: number, targetColumn: number) => {
    if (!selectedWineForMove) return;

    // 同じ位置への移動を防ぐ
    if (
      selectedWineForMove.position_row === targetRow &&
      selectedWineForMove.position_column === targetColumn
    ) {
      alert('ワインは既にこの位置にあります');
      handleCancelMove();
      return;
    }

    // セラーの境界チェック
    if (
      targetRow < 0 || targetRow >= cellar.rows ||
      targetColumn < 0 || targetColumn >= cellar.columns
    ) {
      alert('無効な位置です');
      return;
    }

    // 既存ワインチェック（念のため二重確認）
    const key = `${targetRow}-${targetColumn}`;
    if (positionMap[key]) {
      alert('このセルには既にワインがあります');
      return;
    }

    try {
      // 位置を更新
      await updateWinePosition(
        selectedWineForMove.id,
        cellar.id,
        targetRow,
        targetColumn
      );

      // 状態をリセット
      setSelectedWineForMove(null);
      setSelectedPosition(null);

      // データを再読み込み
      await loadCellarData();

      alert('ワインを移動しました');
    } catch (error) {
      console.error('Error moving wine:', error);
      alert('ワインの移動に失敗しました');
    }
  };

  const handleCancelMove = () => {
    setSelectedWineForMove(null);
    setSelectedPosition(null);
    setShowCellarSelector(false);
  };

  const handleMoveToOtherCellar = (targetCellarId: string) => {
    if (!selectedWineForMove) return;

    // 別のセラーのマップに遷移
    setShowCellarSelector(false);
    router.push({
      pathname: '/cellar/map/[id]' as any,
      params: {
        id: targetCellarId,
        moveWineId: selectedWineForMove.id,
      },
    });
  };

  const renderGrid = () => {
    const rows = [];
    for (let r = 0; r < cellar.rows; r++) {
      const cells = [];
      for (let c = 0; c < cellar.columns; c++) {
        const key = `${r}-${c}`;
        const wine = positionMap[key];
        const isSelected = selectedPosition?.row === r && selectedPosition?.column === c;
        const isHighlighted = highlightedPosition?.row === r && highlightedPosition?.column === c;
        const isSelectedForMove = selectedWineForMove?.position_row === r &&
                                  selectedWineForMove?.position_column === c;
        // ドラッグ&ドロップの視覚的フィードバック
        const isDragOriginCell = isDragging && dragOrigin?.row === r && dragOrigin?.column === c;
        const isHoverCell = isDragging && hoverCell?.row === r && hoverCell?.column === c;
        const isValidDrop = isHoverCell && !wine;
        const isInvalidDrop = isHoverCell && !!wine;

        cells.push(
          <TouchableOpacity
            key={key}
            style={[
              styles.cell,
              wine ? styles.cellOccupied : styles.cellEmpty,
              isSelected && !isSelectedForMove && styles.cellSelected,
              isHighlighted && styles.cellHighlighted,
              isSelectedForMove && styles.cellSelectedForMove,
              isDragOriginCell && styles.cellDragOrigin,
              isValidDrop && styles.cellDragTarget,
              isInvalidDrop && styles.cellDragInvalid,
            ]}
            onPressIn={() => handleCellPressIn(wine, r, c)}
            onPressOut={() => handleCellPressOut(wine, r, c)}
            onPress={() => {}}
          >
            {wine ? (
              <MaterialCommunityIcons
                name="bottle-wine"
                size={24}
                color={isHighlighted ? "#F59E0B" : "#7C3AED"}
              />
            ) : (
              <Text style={styles.cellLabel}>{formatCellarPosition(r, c)}</Text>
            )}
            {isHighlighted && (
              <View style={styles.highlightBadge}>
                <MaterialCommunityIcons name="map-marker" size={12} color="#fff" />
              </View>
            )}
          </TouchableOpacity>
        );
      }
      rows.push(
        <View key={r} style={styles.row}>
          <View style={styles.rowLabel}>
            <Text style={styles.rowLabelText}>{rowToDisplay(r)}</Text>
          </View>
          {cells}
        </View>
      );
    }

    // Add column labels
    const columnLabels = [];
    columnLabels.push(<View key="corner" style={styles.columnLabelCorner} />);
    for (let c = 0; c < cellar.columns; c++) {
      columnLabels.push(
        <View key={c} style={styles.columnLabel}>
          <Text style={styles.columnLabelText}>{columnToLetter(c)}</Text>
        </View>
      );
    }

    return (
      <View>
        <View style={styles.row}>{columnLabels}</View>
        {rows}
      </View>
    );
  };

  const occupiedCount = cellarWines.filter(
    (w) => w.position_row !== null && w.position_column !== null
  ).length;
  const totalSlots = cellar.rows * cellar.columns;
  const occupancyRate = totalSlots > 0 ? (occupiedCount / totalSlots) * 100 : 0;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <MaterialCommunityIcons name="arrow-left" size={24} color="#fff" />
        </TouchableOpacity>
        <View style={styles.headerInfo}>
          <Text style={styles.headerTitle}>{cellar.name}</Text>
          <Text style={styles.headerSubtitle}>
            {occupiedCount} / {totalSlots} ({occupancyRate.toFixed(0)}% 使用中)
          </Text>
        </View>
        <TouchableOpacity onPress={() => router.push(`/cellar/edit/${cellar.id}` as any)}>
          <MaterialCommunityIcons name="cog" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      <ScrollView
        ref={scrollViewRef}
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        horizontal={true}
        onScroll={handleScroll}
        scrollEventThrottle={16}
      >
        <ScrollView style={styles.verticalScroll}>
          <View
            ref={gridRef}
            style={styles.gridContainer}
            onLayout={handleGridLayout}
            onTouchMove={handleDragMove}
            onTouchEnd={handleDragEnd}
            onMouseMove={Platform.OS === 'web' ? handleDragMove : undefined}
            onMouseUp={Platform.OS === 'web' ? handleDragEnd : undefined}
          >
            {renderGrid()}
          </View>
        </ScrollView>
      </ScrollView>

      {/* Highlighted Wine Info Panel */}
      {highlightedPosition && positionMap[`${highlightedPosition.row}-${highlightedPosition.column}`] && (
        <View style={styles.highlightPanel}>
          <View style={styles.highlightHeader}>
            <MaterialCommunityIcons name="map-marker-check" size={24} color="#F59E0B" />
            <Text style={styles.highlightTitle}>このワインの位置</Text>
            <TouchableOpacity onPress={() => {
              setHighlightedPosition(null);
              setSelectedPosition(null);
            }}>
              <MaterialCommunityIcons name="close" size={24} color="#6B7280" />
            </TouchableOpacity>
          </View>
          <View style={styles.highlightWineInfo}>
            <Text style={styles.highlightWineName}>
              {positionMap[`${highlightedPosition.row}-${highlightedPosition.column}`].name}
            </Text>
            <Text style={styles.highlightWinePosition}>
              位置: {formatCellarPosition(highlightedPosition.row, highlightedPosition.column)}
            </Text>
          </View>
          <TouchableOpacity
            style={styles.highlightButton}
            onPress={() => {
              const wine = positionMap[`${highlightedPosition.row}-${highlightedPosition.column}`];
              router.push(`/wine/${wine.id}` as any);
            }}
          >
            <Text style={styles.highlightButtonText}>ワイン詳細を見る</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* ドラッグ中のガイド */}
      {isDragging && draggedWine && (
        <View style={styles.dragGuide}>
          <MaterialCommunityIcons name="hand-back-right" size={20} color="#3B82F6" />
          <Text style={styles.dragGuideText}>
            「{draggedWine.name}」を移動先にドラッグしてください
          </Text>
        </View>
      )}

      {/* ワイン選択時のアクションパネル */}
      {selectedWineForMove && !showCellarSelector && !isDragging && (
        <View style={styles.actionPanel}>
          <View style={styles.actionHeader}>
            <Text style={styles.actionPanelTitle}>
              {selectedWineForMove.name}
            </Text>
            <TouchableOpacity onPress={handleCancelMove}>
              <MaterialCommunityIcons name="close" size={24} color="#6B7280" />
            </TouchableOpacity>
          </View>
          <TouchableOpacity
            style={[styles.actionButton, styles.actionButtonWarning]}
            onPress={() => setShowCellarSelector(true)}
          >
            <MaterialCommunityIcons name="swap-horizontal" size={24} color="#fff" />
            <Text style={styles.actionButtonText}>別のセラーに移動</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionButton, styles.actionButtonInfo]}
            onPress={() => {
              router.push(`/wine/${selectedWineForMove.id}` as any);
              setSelectedWineForMove(null);
            }}
          >
            <MaterialCommunityIcons name="information" size={24} color="#fff" />
            <Text style={styles.actionButtonText}>詳細を見る</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionButton, styles.actionButtonSecondary]}
            onPress={handleCancelMove}
          >
            <Text style={styles.actionButtonText}>キャンセル</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* セラー選択パネル */}
      {showCellarSelector && selectedWineForMove && (
        <View style={styles.actionPanel}>
          <View style={styles.actionHeader}>
            <Text style={styles.actionPanelTitle}>
              移動先のセラーを選択
            </Text>
            <TouchableOpacity onPress={() => setShowCellarSelector(false)}>
              <MaterialCommunityIcons name="close" size={24} color="#6B7280" />
            </TouchableOpacity>
          </View>
          <ScrollView style={styles.cellarList}>
            {cellars
              .filter((c) => c.id !== cellar.id)
              .map((targetCellar) => (
                <TouchableOpacity
                  key={targetCellar.id}
                  style={styles.cellarListItem}
                  onPress={() => handleMoveToOtherCellar(targetCellar.id)}
                >
                  <MaterialCommunityIcons name="grid" size={24} color="#7C3AED" />
                  <View style={styles.cellarListItemText}>
                    <Text style={styles.cellarListItemName}>{targetCellar.name}</Text>
                    <Text style={styles.cellarListItemInfo}>
                      {targetCellar.rows} × {targetCellar.columns}
                    </Text>
                  </View>
                  <MaterialCommunityIcons name="chevron-right" size={24} color="#9CA3AF" />
                </TouchableOpacity>
              ))}
          </ScrollView>
          {cellars.filter((c) => c.id !== cellar.id).length === 0 && (
            <Text style={styles.noOtherCellarsText}>
              他のセラーがありません
            </Text>
          )}
        </View>
      )}

      {/* 空きセル選択時のアクションパネル */}
      {selectedPosition && !selectedWineForMove && !positionMap[`${selectedPosition.row}-${selectedPosition.column}`] && (
        <View style={styles.actionPanel}>
          <View style={styles.actionHeader}>
            <Text style={styles.actionTitle}>
              位置 {formatCellarPosition(selectedPosition.row, selectedPosition.column)}
            </Text>
            <TouchableOpacity onPress={() => setSelectedPosition(null)}>
              <MaterialCommunityIcons name="close" size={24} color="#6B7280" />
            </TouchableOpacity>
          </View>
          <TouchableOpacity style={styles.actionButton} onPress={handleAddWineHere}>
            <MaterialCommunityIcons name="plus-circle" size={24} color="#fff" />
            <Text style={styles.actionButtonText}>ここにワインを追加</Text>
          </TouchableOpacity>
        </View>
      )}

      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View style={[styles.legendColor, { backgroundColor: '#EDE9FE' }]} />
          <Text style={styles.legendText}>ワインあり</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendColor, { backgroundColor: '#F3F4F6' }]} />
          <Text style={styles.legendText}>空き</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#7C3AED',
    padding: 16,
    paddingTop: 60,
  },
  backButton: {
    padding: 8,
  },
  headerInfo: {
    flex: 1,
    marginHorizontal: 12,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#E9D5FF',
    marginTop: 2,
  },
  scrollView: {
    flex: 1,
  },
  verticalScroll: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  gridContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 8,
  },
  row: {
    flexDirection: 'row',
  },
  rowLabel: {
    width: CELL_SIZE,
    height: CELL_SIZE,
    justifyContent: 'center',
    alignItems: 'center',
  },
  rowLabelText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
  },
  columnLabel: {
    width: CELL_SIZE,
    height: CELL_SIZE,
    justifyContent: 'center',
    alignItems: 'center',
  },
  columnLabelCorner: {
    width: CELL_SIZE,
    height: CELL_SIZE,
  },
  columnLabelText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
  },
  cell: {
    width: CELL_SIZE,
    height: CELL_SIZE,
    margin: CELL_MARGIN,
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
  },
  cellEmpty: {
    backgroundColor: '#F3F4F6',
    borderColor: '#E5E7EB',
  },
  cellOccupied: {
    backgroundColor: '#EDE9FE',
    borderColor: '#7C3AED',
  },
  cellSelected: {
    borderWidth: 2,
    borderColor: '#10B981',
  },
  cellSelectedForMove: {
    borderColor: '#F59E0B',
    borderWidth: 3,
    backgroundColor: '#FEF3C7',
  },
  cellMoveTarget: {
    borderColor: '#10B981',
    borderWidth: 2,
    borderStyle: 'dashed',
    backgroundColor: '#D1FAE5',
  },
  cellHighlighted: {
    backgroundColor: '#FEF3C7',
    borderWidth: 3,
    borderColor: '#F59E0B',
    shadowColor: '#F59E0B',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 8,
  },
  cellDragOrigin: {
    borderWidth: 2,
    borderColor: '#F59E0B',
    borderStyle: 'dashed',
    opacity: 0.5,
  },
  cellDragTarget: {
    borderColor: '#10B981',
    borderWidth: 3,
    backgroundColor: '#D1FAE5',
    borderStyle: 'dashed',
  },
  cellDragInvalid: {
    borderColor: '#EF4444',
    borderWidth: 3,
    backgroundColor: '#FEE2E2',
  },
  highlightBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    backgroundColor: '#F59E0B',
    borderRadius: 8,
    width: 16,
    height: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cellLabel: {
    fontSize: 8,
    color: '#9CA3AF',
  },
  highlightPanel: {
    backgroundColor: '#FFFBEB',
    borderTopWidth: 2,
    borderTopColor: '#F59E0B',
    padding: 16,
  },
  highlightHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  highlightTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: '#92400E',
  },
  highlightWineInfo: {
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  highlightWineName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 4,
  },
  highlightWinePosition: {
    fontSize: 14,
    color: '#F59E0B',
    fontWeight: '600',
  },
  highlightButton: {
    backgroundColor: '#F59E0B',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  highlightButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  actionPanel: {
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    padding: 16,
  },
  actionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  actionPanelTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1F2937',
    flex: 1,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#7C3AED',
    padding: 14,
    borderRadius: 8,
    marginBottom: 8,
  },
  actionButtonInfo: {
    backgroundColor: '#3B82F6',
  },
  actionButtonWarning: {
    backgroundColor: '#F59E0B',
  },
  actionButtonSecondary: {
    backgroundColor: '#6B7280',
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  moveModeGuide: {
    position: 'absolute',
    top: 120,
    left: 16,
    right: 16,
    backgroundColor: '#D1FAE5',
    borderRadius: 8,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: '#10B981',
    zIndex: 10,
  },
  moveModeGuideText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#059669',
    flex: 1,
  },
  dragGuide: {
    position: 'absolute',
    top: 120,
    left: 16,
    right: 16,
    backgroundColor: '#DBEAFE',
    borderRadius: 8,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: '#3B82F6',
    zIndex: 10,
  },
  dragGuideText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E40AF',
    flex: 1,
  },
  cellarList: {
    maxHeight: 200,
  },
  cellarListItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  cellarListItemText: {
    flex: 1,
    marginLeft: 12,
  },
  cellarListItemName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  cellarListItemInfo: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 2,
  },
  noOtherCellarsText: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
    padding: 16,
    fontStyle: 'italic',
  },
  legend: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    padding: 12,
    gap: 16,
    justifyContent: 'center',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  legendColor: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#D1D5DB',
  },
  legendText: {
    fontSize: 14,
    color: '#6B7280',
  },
});
