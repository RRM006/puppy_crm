import React, { useState } from 'react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import DealCard from './DealCard';
import { moveDealStage } from '../../services/dealService';

const DealBoard = ({ stages, dealsByStage, onDealClick, onMoveSuccess, onError }) => {
  const [movingDealId, setMovingDealId] = useState(null);

  const handleDragEnd = async (result) => {
    const { destination, source, draggableId } = result;

    // If dropped outside a droppable area
    if (!destination) return;

    // If dropped in the same position
    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    ) {
      return;
    }

    const dealId = parseInt(draggableId);
    const newStageId = parseInt(destination.droppableId);
    const oldStageId = parseInt(source.droppableId);

    // If moving to the same stage, do nothing
    if (newStageId === oldStageId) return;

    setMovingDealId(dealId);

    try {
      await moveDealStage(dealId, newStageId);
      onMoveSuccess?.();
    } catch (error) {
      const msg = error?.detail || error?.message || 'Failed to move deal';
      onError?.(msg);
    } finally {
      setMovingDealId(null);
    }
  };

  const getTotalValue = (stageId) => {
    const stageIdKey = stageId.toString();
    const deals = dealsByStage[stageIdKey] || dealsByStage[stageId] || [];
    return deals.reduce((sum, deal) => sum + (parseFloat(deal.value) || 0), 0);
  };

  const formatCurrency = (value, currency = 'USD') => {
    if (!value) return '$0';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency || 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <div
        style={{
          display: 'flex',
          gap: 16,
          overflowX: 'auto',
          padding: '8px 0',
          minHeight: '600px',
          WebkitOverflowScrolling: 'touch'
        }}
        className="deal-board-container"
      >
      {stages.map((stage) => {
        // Handle both string and number stage IDs
        const stageIdKey = stage.id.toString();
        const deals = dealsByStage[stageIdKey] || dealsByStage[stage.id] || [];
        const totalValue = getTotalValue(stageIdKey) || getTotalValue(stage.id) || 0;
        const isLoading = movingDealId && deals.some(d => d.id === movingDealId);

          return (
            <div
              key={stage.id}
              style={{
                minWidth: 320,
                width: 320,
                maxWidth: '90vw',
                background: '#f8fafc',
                borderRadius: 12,
                padding: 16,
                display: 'flex',
                flexDirection: 'column',
                border: '1px solid #e2e8f0',
                flexShrink: 0
              }}
            >
              {/* Column Header */}
              <div style={{ marginBottom: 16 }}>
                <div
                  style={{
                    fontSize: 14,
                    fontWeight: 600,
                    color: '#0f172a',
                    marginBottom: 4
                  }}
                >
                  {stage.name}
                </div>
                <div
                  style={{
                    fontSize: 12,
                    color: '#64748b',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}
                >
                  <span>{deals.length} {deals.length === 1 ? 'deal' : 'deals'}</span>
                  <span style={{ fontWeight: 500, color: '#10b981' }}>
                    {formatCurrency(totalValue)}
                  </span>
                </div>
                {stage.probability !== undefined && (
                  <div
                    style={{
                      fontSize: 11,
                      color: '#94a3b8',
                      marginTop: 4
                    }}
                  >
                    {stage.probability}% probability
                  </div>
                )}
              </div>

              {/* Droppable Area */}
              <Droppable droppableId={stageIdKey}>
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    style={{
                      flex: 1,
                      minHeight: 100,
                      background: snapshot.isDraggingOver ? '#eff6ff' : 'transparent',
                      borderRadius: 8,
                      padding: 4,
                      transition: 'background 0.2s ease'
                    }}
                  >
                    {deals.map((deal, index) => (
                      <Draggable
                        key={deal.id}
                        draggableId={deal.id.toString()}
                        index={index}
                        isDragDisabled={movingDealId === deal.id}
                      >
                        {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                            style={{
                              ...provided.draggableProps.style,
                              opacity: movingDealId === deal.id ? 0.5 : snapshot.isDragging ? 0.8 : 1
                            }}
                          >
                            <DealCard
                              deal={deal}
                              onClick={() => onDealClick(deal)}
                            />
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                    {deals.length === 0 && (
                      <div
                        style={{
                          textAlign: 'center',
                          padding: 40,
                          color: '#94a3b8',
                          fontSize: 13
                        }}
                      >
                        No deals
                      </div>
                    )}
                  </div>
                )}
              </Droppable>
            </div>
          );
        })}
      </div>
    </DragDropContext>
  );
};

export default DealBoard;

