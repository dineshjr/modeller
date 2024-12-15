import React, { useEffect, useRef, useState } from 'react';
import BpmnModeler from 'bpmn-js/lib/Modeler';
import 'bpmn-js/dist/assets/diagram-js.css';
import 'bpmn-js/dist/assets/bpmn-font/css/bpmn-embedded.css';
import '../App.css';

const initialDiagram = `<?xml version="1.0" encoding="UTF-8"?>
<bpmn2:definitions 
  xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
  xmlns:bpmn2="http://www.omg.org/spec/BPMN/20100524/MODEL"
  xmlns:bpmndi="http://www.omg.org/spec/BPMN/20100524/DI"
  xmlns:dc="http://www.omg.org/spec/DD/20100524/DC"
  xmlns:di="http://www.omg.org/spec/DD/20100524/DI"
  id="sample-diagram"
  targetNamespace="http://bpmn.io/schema/bpmn">
  <bpmn2:process id="Process_1" isExecutable="false">
    <bpmn2:startEvent id="StartEvent_1"/>
  </bpmn2:process>
  <bpmndi:BPMNDiagram id="BPMNDiagram_1">
    <bpmndi:BPMNPlane id="BPMNPlane_1" bpmnElement="Process_1">
      <bpmndi:BPMNShape id="_BPMNShape_StartEvent_2" bpmnElement="StartEvent_1">
        <dc:Bounds height="36.0" width="36.0" x="412.0" y="240.0"/>
      </bpmndi:BPMNShape>
    </bpmndi:BPMNPlane>
  </bpmndi:BPMNDiagram>
</bpmn2:definitions>`;

const PropertiesPanel = ({ selectedElement, onPropertyChange }) => {
  const [localProperties, setLocalProperties] = useState({
    id: '',
    name: '',
    assignee: '',
    implementation: ''
  });

  useEffect(() => {
    if (selectedElement) {
      setLocalProperties({
        id: selectedElement.id || '',
        name: selectedElement.businessObject?.name || '',
        assignee: selectedElement.businessObject?.assignee || '',
        implementation: selectedElement.businessObject?.implementation || ''
      });
    }
  }, [selectedElement]);

  if (!selectedElement) {
    return <div className="properties-placeholder">Select an element to edit properties</div>;
  }

  const handleInputChange = (property, value) => {
    setLocalProperties(prev => ({
      ...prev,
      [property]: value
    }));
    onPropertyChange(property, value);
  };

  return (
    <div className="properties-panel">
      <div className="property-group">
        <h3>General</h3>
        <div className="property-row">
          <label>ID:</label>
          <input
            type="text"
            value={localProperties.id}
            onChange={(e) => handleInputChange('id', e.target.value)}
          />
        </div>
        <div className="property-row">
          <label>Name:</label>
          <input
            type="text"
            value={localProperties.name}
            onChange={(e) => handleInputChange('name', e.target.value)}
          />
        </div>
      </div>

      {selectedElement.type === 'bpmn:Task' && (
        <div className="property-group">
          <h3>Task Properties</h3>
          <div className="property-row">
            <label>Assignee:</label>
            <input
              type="text"
              value={localProperties.assignee}
              onChange={(e) => handleInputChange('assignee', e.target.value)}
            />
          </div>
        </div>
      )}

      {selectedElement.type === 'bpmn:ServiceTask' && (
        <div className="property-group">
          <h3>Service Task Properties</h3>
          <div className="property-row">
            <label>Implementation:</label>
            <input
              type="text"
              value={localProperties.implementation}
              onChange={(e) => handleInputChange('implementation', e.target.value)}
            />
          </div>
        </div>
      )}
    </div>
  );
};

const Modeller = () => {
  const [modeler, setModeler] = useState(null);
  const [selectedElement, setSelectedElement] = useState(null);
  const containerRef = useRef(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // Create a new modeler instance with additional configuration
    const bpmnModeler = new BpmnModeler({
      container: containerRef.current,
      additionalModules: [],
      propertiesPanel: {
        parent: '.properties-container'
      },
      disableBpmnJsLogo: true  // Set this to true to remove the watermark
    });


    const setupModeler = async () => {
      try {
        // Import the diagram
        const result = await bpmnModeler.importXML(initialDiagram);

        if (result.warnings.length) {
          console.warn('Warnings while importing BPMN diagram:', result.warnings);
        }

        // Get the canvas only after the diagram is imported successfully
        const canvas = bpmnModeler.get('canvas');
        if (!canvas) {
          throw new Error('Canvas not found');
        }

        // Zoom to fit the viewport
        canvas.zoom('fit-viewport');

        // Set up event listeners
        bpmnModeler.on('selection.changed', ({ newSelection }) => {
          setSelectedElement(newSelection[0] || null);
        });

        bpmnModeler.on('element.changed', (event) => {
          if (event.element === selectedElement) {
            setSelectedElement({ ...event.element });
          }
        });

        setModeler(bpmnModeler);
      } catch (error) {
        console.error('Error setting up BPMN modeler:', error);
      }
    };

    setupModeler();

    return () => {
      if (bpmnModeler) {
        bpmnModeler.destroy();
      }
    };
  }, []);

  const handlePropertyChange = (property, value) => {
    if (!modeler || !selectedElement) return;

    const modeling = modeler.get('modeling');

    try {
      if (property === 'id') {
        modeling.updateProperties(selectedElement, { id: value });
      } else {
        modeling.updateProperties(selectedElement, { [property]: value });
      }
    } catch (error) {
      console.error('Error updating properties:', error);
    }
  };

  const handleSave = async () => {
    if (!modeler) return;

    try {
      const { xml } = await modeler.saveXML({ format: true });
      console.log(xml);
      // Here you would typically send the XML to your backend
    } catch (error) {
      console.error('Error saving diagram:', error);
    }
  };

  return (
    <div className="app-container">
      <div className="toolbar">
        <button onClick={handleSave}>Save Diagram</button>
      </div>
      <div className="main-content">
        <div className="modeler-container" ref={containerRef}></div>
        <div className="properties-container">
          <PropertiesPanel
            selectedElement={selectedElement}
            onPropertyChange={handlePropertyChange}
          />
        </div>
      </div>
    </div>
  );
};
export default Modeller;