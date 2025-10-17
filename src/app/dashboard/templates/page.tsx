"use client";

import React, { useState } from 'react';
import { TemplateList } from '@/components/templates/TemplateList';
import { TemplateEditor } from '@/components/templates/TemplateEditor';
import { TemplateListItem, TemplateFullData, TemplateEditorData } from '@/types/templates';

type ViewMode = 'list' | 'editor';

export default function TemplatesPage() {
  // Estados principales
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [editingTemplate, setEditingTemplate] = useState<TemplateFullData | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Funciones de navegación
  const handleNewTemplate = () => {
    setEditingTemplate(null);
    setViewMode('editor');
  };

  // Función para editar template
  const handleEditTemplate = async (template: TemplateListItem) => {
    setIsLoading(true);
    
    try {
      // Obtener el template completo con contenido HTML
      const response = await fetch(`/api/templates/${template.id}`);
      if (!response.ok) {
        throw new Error('Error al cargar template');
      }
      
      const fullTemplate: TemplateFullData = await response.json();
      setEditingTemplate(fullTemplate);
      setViewMode('editor');
    } catch (error) {
      console.error('Error loading template:', error);
      // Si hay error, crear un template básico con el contenido mínimo
      const basicTemplate: TemplateFullData = {
        ...template,
        htmlContent: '',
      };
      setEditingTemplate(basicTemplate);
      setViewMode('editor');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancelEdit = () => {
    setEditingTemplate(null);
    setViewMode('list');
  };

  // Función para guardar template
  const handleSaveTemplate = async (data: TemplateEditorData) => {
    setIsLoading(true);

    try {
      const url = editingTemplate 
        ? `/api/templates/${editingTemplate.id}`
        : '/api/templates';
      
      const method = editingTemplate ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Error al guardar template');
      }

      const savedTemplate = await response.json();
      
      // Volver a la lista
      setViewMode('list');
      setEditingTemplate(null);

      return savedTemplate;

    } catch (error) {
      console.error('Error saving template:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-6">
      {viewMode === 'list' ? (
        <TemplateList 
          onEdit={handleEditTemplate}
          onNew={handleNewTemplate}
        />
      ) : (
        <TemplateEditor
          template={editingTemplate}
          onSave={handleSaveTemplate}
          onCancel={handleCancelEdit}
          isLoading={isLoading}
        />
      )}
    </div>
  );
}