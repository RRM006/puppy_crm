import React, { useState, useEffect } from 'react';
import { FiPlus, FiEdit2, FiTrash2, FiCheck, FiAlertCircle, FiMove } from 'react-icons/fi';
import { useAuth } from '../contexts/AuthContext';
import { getPipelines, deletePipeline, deleteStage, reorderStages } from '../services/pipelineService';
import CreatePipelineModal from '../components/pipeline/CreatePipelineModal';
import EditPipelineModal from '../components/pipeline/EditPipelineModal';
import EditStageModal from '../components/pipeline/EditStageModal';
import CreateStageModal from '../components/pipeline/CreateStageModal';
import Toast from '../components/common/Toast';

const PipelineSettings = () => {
  const { company } = useAuth();
  const [pipelines, setPipelines] = useState([]);
  const [selectedPipeline, setSelectedPipeline] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showCreatePipeline, setShowCreatePipeline] = useState(false);
  const [showEditPipeline, setShowEditPipeline] = useState(false);
  const [showEditStage, setShowEditStage] = useState(false);
  const [showCreateStage, setShowCreateStage] = useState(false);
  const [editingStage, setEditingStage] = useState(null);
  const [toasts, setToasts] = useState([]);
  const [draggedStage, setDraggedStage] = useState(null);

  const pushToast = (message, type = 'info') => {
    const id = Date.now();
    setToasts(t => [...t, { id, message, type, timeout: 3000 }]);
  };
  const removeToast = (id) => setToasts(t => t.filter(x => x.id !== id));

  useEffect(() => {
    loadPipelines();
  }, []);

  const loadPipelines = async () => {
    setLoading(true);
    try {
      const data = await getPipelines(company?.id);
      const list = Array.isArray(data) ? data : [];
      setPipelines(list);
      if (list.length > 0 && !selectedPipeline) {
        setSelectedPipeline(list[0]);
      } else if (selectedPipeline) {
        const updated = list.find(p => p.id === selectedPipeline.id);
        setSelectedPipeline(updated || list[0] || null);
      }
    } catch (err) {
      pushToast('Failed to load pipelines', 'error');
      setPipelines([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDeletePipeline = async (pipeline) => {
    if (pipeline.total_deals_count > 0) {
      pushToast('Cannot delete pipeline with active deals', 'error');
      return;
    }
    if (!window.confirm(`Delete pipeline "${pipeline.name}"?\nThis action cannot be undone.`)) return;
    try {
      await deletePipeline(pipeline.id);
      pushToast('Pipeline deleted successfully', 'success');
      loadPipelines();
    } catch (err) {
      pushToast(err?.detail || 'Failed to delete pipeline', 'error');
    }
  };

  const handleDeleteStage = async (stage) => {
    if (stage.deal_count > 0) {
      pushToast('Cannot delete stage with existing deals', 'error');
      return;
    }
    if (!window.confirm(`Delete stage "${stage.name}"?\nThis action cannot be undone.`)) return;
    try {
      await deleteStage(stage.id);
      pushToast('Stage deleted successfully', 'success');
      loadPipelines();
    } catch (err) {
      pushToast(err?.detail || 'Failed to delete stage', 'error');
    }
  };

  const handleEditStage = (stage) => {
    setEditingStage(stage);
    setShowEditStage(true);
  };

  const handleDragStart = (e, stage) => {
    setDraggedStage(stage);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = async (e, targetStage) => {
    e.preventDefault();
    if (!draggedStage || draggedStage.id === targetStage.id) {
      setDraggedStage(null);
      return;
    }

    const stages = [...selectedPipeline.stages];
    const draggedIdx = stages.findIndex(s => s.id === draggedStage.id);
    const targetIdx = stages.findIndex(s => s.id === targetStage.id);

    if (draggedIdx === -1 || targetIdx === -1) {
      setDraggedStage(null);
      return;
    }

    // Reorder stages locally
    stages.splice(draggedIdx, 1);
    stages.splice(targetIdx, 0, draggedStage);

    // Update order numbers
    const stageUpdates = stages.map((s, idx) => ({
      id: s.id,
      order: idx + 1
    }));

    try {
      await reorderStages(selectedPipeline.id, stageUpdates);
      pushToast('Stages reordered successfully', 'success');
      loadPipelines();
    } catch (err) {
      pushToast('Failed to reorder stages', 'error');
    } finally {
      setDraggedStage(null);
    }
  };

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div>
          <h2 style={{ margin: 0, fontSize: 24 }}>Pipeline Settings</h2>
          <div style={{ fontSize: 14, color: '#64748b', marginTop: 4 }}>
            Manage your sales pipelines and deal stages
          </div>
        </div>
        <button
          onClick={() => setShowCreatePipeline(true)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            padding: '10px 16px',
            borderRadius: 8,
            border: 'none',
            background: '#4c6fff',
            color: 'white',
            cursor: 'pointer',
            fontWeight: 500
          }}
        >
          <FiPlus /> New Pipeline
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: 20 }}>
        {/* Pipelines List */}
        <div style={{ background: 'white', borderRadius: 12, padding: 16, boxShadow: '0 2px 8px rgba(0,0,0,0.08)', height: 'fit-content' }}>
          <h3 style={{ margin: '0 0 12px 0', fontSize: 16 }}>Pipelines</h3>
          {loading ? (
            <div style={{ padding: 20, textAlign: 'center', color: '#94a3b8' }}>Loading...</div>
          ) : pipelines.length === 0 ? (
            <div style={{ padding: 20, textAlign: 'center', color: '#94a3b8' }}>
              <div style={{ fontSize: 32, marginBottom: 8 }}>📊</div>
              <div style={{ fontSize: 14 }}>No pipelines yet</div>
              <button
                onClick={() => setShowCreatePipeline(true)}
                style={{
                  marginTop: 12,
                  padding: '8px 14px',
                  borderRadius: 8,
                  border: 'none',
                  background: '#4c6fff',
                  color: 'white',
                  cursor: 'pointer'
                }}
              >
                Create First Pipeline
              </button>
            </div>
          ) : (
            <div style={{ display: 'grid', gap: 8 }}>
              {pipelines.map(pipeline => (
                <div
                  key={pipeline.id}
                  onClick={() => setSelectedPipeline(pipeline)}
                  style={{
                    padding: 12,
                    borderRadius: 8,
                    border: `2px solid ${selectedPipeline?.id === pipeline.id ? '#4c6fff' : '#e2e8f0'}`,
                    background: selectedPipeline?.id === pipeline.id ? '#f0f4ff' : 'white',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                    <div style={{ fontWeight: 600, fontSize: 14, display: 'flex', alignItems: 'center', gap: 6 }}>
                      {pipeline.name}
                      {pipeline.is_default && (
                        <span style={{
                          padding: '2px 6px',
                          borderRadius: 999,
                          fontSize: 10,
                          fontWeight: 600,
                          background: '#10b981',
                          color: 'white'
                        }}>
                          DEFAULT
                        </span>
                      )}
                    </div>
                    <div style={{ display: 'flex', gap: 4 }}>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedPipeline(pipeline);
                          setShowEditPipeline(true);
                        }}
                        title="Edit Pipeline"
                        style={{
                          padding: 4,
                          border: 'none',
                          background: 'transparent',
                          cursor: 'pointer',
                          color: '#4c6fff'
                        }}
                      >
                        <FiEdit2 size={14} />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeletePipeline(pipeline);
                        }}
                        title="Delete Pipeline"
                        style={{
                          padding: 4,
                          border: 'none',
                          background: 'transparent',
                          cursor: 'pointer',
                          color: '#ef4444'
                        }}
                      >
                        <FiTrash2 size={14} />
                      </button>
                    </div>
                  </div>
                  <div style={{ fontSize: 12, color: '#64748b' }}>
                    {pipeline.stages?.length || 0} stages · {pipeline.total_deals_count || 0} deals
                  </div>
                  {pipeline.description && (
                    <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {pipeline.description}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Stages Panel */}
        <div style={{ background: 'white', borderRadius: 12, padding: 20, boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
          {selectedPipeline ? (
            <>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: 18 }}>{selectedPipeline.name} - Stages</h3>
                  <div style={{ fontSize: 13, color: '#64748b', marginTop: 4 }}>
                    Drag stages to reorder
                  </div>
                </div>
                <button
                  onClick={() => setShowCreateStage(true)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: '8px 12px',
                    borderRadius: 8,
                    border: '1px solid #e2e8f0',
                    background: 'white',
                    cursor: 'pointer'
                  }}
                >
                  <FiPlus /> Add Stage
                </button>
              </div>

              {selectedPipeline.stages?.length === 0 ? (
                <div style={{ padding: 40, textAlign: 'center', color: '#94a3b8' }}>
                  <div style={{ fontSize: 32, marginBottom: 8 }}>📋</div>
                  <div style={{ fontSize: 14 }}>No stages yet</div>
                  <button
                    onClick={() => setShowCreateStage(true)}
                    style={{
                      marginTop: 12,
                      padding: '8px 14px',
                      borderRadius: 8,
                      border: 'none',
                      background: '#4c6fff',
                      color: 'white',
                      cursor: 'pointer'
                    }}
                  >
                    Add First Stage
                  </button>
                </div>
              ) : (
                <div style={{ display: 'grid', gap: 12 }}>
                  {selectedPipeline.stages
                    .sort((a, b) => a.order - b.order)
                    .map((stage, idx) => (
                      <div
                        key={stage.id}
                        draggable
                        onDragStart={(e) => handleDragStart(e, stage)}
                        onDragOver={handleDragOver}
                        onDrop={(e) => handleDrop(e, stage)}
                        style={{
                          padding: 16,
                          borderRadius: 8,
                          border: '2px solid #e2e8f0',
                          background: draggedStage?.id === stage.id ? '#f8fafc' : 'white',
                          cursor: 'move',
                          transition: 'all 0.15s ease'
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                            <div style={{
                              width: 32,
                              height: 32,
                              borderRadius: 8,
                              background: '#f1f5f9',
                              display: 'grid',
                              placeItems: 'center',
                              color: '#64748b',
                              fontWeight: 600,
                              fontSize: 14
                            }}>
                              {idx + 1}
                            </div>
                            <div>
                              <div style={{ fontWeight: 600, fontSize: 15 }}>{stage.name}</div>
                              <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>
                                {stage.probability}% probability · Order #{stage.order} · {stage.deal_count || 0} deals
                              </div>
                            </div>
                          </div>
                          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                            <FiMove style={{ color: '#94a3b8', cursor: 'grab' }} />
                            <button
                              onClick={() => handleEditStage(stage)}
                              title="Edit Stage"
                              style={{
                                padding: 6,
                                border: 'none',
                                background: 'transparent',
                                cursor: 'pointer',
                                color: '#4c6fff'
                              }}
                            >
                              <FiEdit2 size={16} />
                            </button>
                            <button
                              onClick={() => handleDeleteStage(stage)}
                              title="Delete Stage"
                              style={{
                                padding: 6,
                                border: 'none',
                                background: 'transparent',
                                cursor: 'pointer',
                                color: '#ef4444'
                              }}
                            >
                              <FiTrash2 size={16} />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </>
          ) : (
            <div style={{ padding: 60, textAlign: 'center', color: '#94a3b8' }}>
              <div style={{ fontSize: 32, marginBottom: 8 }}>👈</div>
              <div>Select a pipeline to manage its stages</div>
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      <CreatePipelineModal
        open={showCreatePipeline}
        onClose={() => setShowCreatePipeline(false)}
        onSuccess={(msg) => {
          pushToast(msg, 'success');
          loadPipelines();
        }}
        onError={(msg) => pushToast(msg, 'error')}
      />

      <EditPipelineModal
        open={showEditPipeline}
        onClose={() => setShowEditPipeline(false)}
        pipeline={selectedPipeline}
        onSuccess={(msg) => {
          pushToast(msg, 'success');
          loadPipelines();
        }}
        onError={(msg) => pushToast(msg, 'error')}
      />

      <EditStageModal
        open={showEditStage}
        onClose={() => {
          setShowEditStage(false);
          setEditingStage(null);
        }}
        stage={editingStage}
        onSuccess={(msg) => {
          pushToast(msg, 'success');
          loadPipelines();
        }}
        onError={(msg) => pushToast(msg, 'error')}
      />

      <CreateStageModal
        open={showCreateStage}
        onClose={() => setShowCreateStage(false)}
        pipelineId={selectedPipeline?.id}
        onSuccess={(msg) => {
          pushToast(msg, 'success');
          loadPipelines();
        }}
        onError={(msg) => pushToast(msg, 'error')}
      />

      <Toast toasts={toasts} remove={removeToast} />
    </div>
  );
};

export default PipelineSettings;
