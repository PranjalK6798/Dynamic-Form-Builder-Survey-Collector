// Formulate - Dynamic Form Builder & Survey Collector
// Main Application JavaScript

class FormulateApp {
    constructor() {
        this.currentUser = null;
        this.currentView = 'login';
        this.currentForm = null;
        this.selectedField = null;
        this.fieldCounter = 0;
        this.forms = [];
        this.responses = [];
        
        this.init();
    }

    init() {
        this.checkAuth();
        this.bindEvents();
        this.loadData();
        this.setupTheme();
    }

    // Authentication
    checkAuth() {
        const user = localStorage.getItem('formulate_user');
        if (user) {
            this.currentUser = JSON.parse(user);
            this.showView('dashboard');
        } else {
            this.showView('login');
        }
    }

    login(email, password) {
        // Demo authentication
        if (email === 'admin@demo.com' && password === 'password') {
            this.currentUser = { email, name: 'Demo User' };
            localStorage.setItem('formulate_user', JSON.stringify(this.currentUser));
            this.showView('dashboard');
            this.showToast('Welcome to Formulate!', 'success');
        } else {
            this.showToast('Invalid credentials. Use admin@demo.com / password', 'error');
        }
    }

    logout() {
        localStorage.removeItem('formulate_user');
        this.currentUser = null;
        this.showView('login');
        this.showToast('Logged out successfully', 'info');
    }

    // Data Management
    loadData() {
        const forms = localStorage.getItem('formulate_forms');
        const responses = localStorage.getItem('formulate_responses');
        
        this.forms = forms ? JSON.parse(forms) : this.getSampleData();
        this.responses = responses ? JSON.parse(responses) : [];
        
        this.saveData();
    }

    saveData() {
        localStorage.setItem('formulate_forms', JSON.stringify(this.forms));
        localStorage.setItem('formulate_responses', JSON.stringify(this.responses));
    }

    getSampleData() {
        return [{
            id: 'form_' + Date.now(),
            title: 'Customer Feedback Survey',
            description: 'Help us improve our services',
            pages: [{
                id: 'page_1',
                title: 'Basic Information',
                fields: [{
                    id: 'field_1',
                    type: 'text',
                    label: 'Full Name',
                    required: true,
                    placeholder: 'Enter your full name'
                }, {
                    id: 'field_2',
                    type: 'email',
                    label: 'Email Address',
                    required: true,
                    placeholder: 'Enter your email'
                }]
            }],
            isPublished: false,
            createdAt: new Date().toISOString(),
            responses: []
        }];
    }

    // View Management
    showView(viewName) {
        // Hide all views
        document.querySelectorAll('.view').forEach(view => {
            view.style.display = 'none';
        });

        // Show target view
        const targetView = document.getElementById(viewName + 'View');
        if (targetView) {
            targetView.style.display = 'block';
            this.currentView = viewName;
        }

        // Show/hide header
        const header = document.getElementById('header');
        if (viewName === 'login' || viewName === 'publicForm') {
            header.style.display = 'none';
        } else {
            header.style.display = 'block';
        }

        // Update navigation
        this.updateNavigation();

        // Load view-specific data
        switch (viewName) {
            case 'dashboard':
                this.loadDashboard();
                break;
            case 'results':
                this.loadResults();
                break;
            case 'builder':
                // Setup drag and drop when entering builder view
                setTimeout(() => this.setupDragAndDrop(), 200);
                break;
        }
    }

    updateNavigation() {
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.classList.remove('active');
            if (btn.dataset.view === this.currentView) {
                btn.classList.add('active');
            }
        });
    }

    // Dashboard
    loadDashboard() {
        const totalForms = this.forms.length;
        const publishedForms = this.forms.filter(f => f.isPublished).length;
        const totalResponses = this.responses.length;

        document.getElementById('totalForms').textContent = totalForms;
        document.getElementById('publishedForms').textContent = publishedForms;
        document.getElementById('totalResponses').textContent = totalResponses;

        this.renderFormsList();
    }

    renderFormsList() {
        const container = document.getElementById('formsList');
        
        if (this.forms.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <h3>No forms yet</h3>
                    <p>Create your first form to get started</p>
                    <button class="btn btn--primary" onclick="app.createNewForm()">
                        ➕ Create New Form
                    </button>
                </div>
            `;
            return;
        }

        container.innerHTML = this.forms.map(form => `
            <div class="form-card card">
                <div class="card__body">
                    <div class="form-card__header">
                        <h3 class="form-card__title">${form.title}</h3>
                        <span class="status ${form.isPublished ? 'status--success' : 'status--info'}">
                            ${form.isPublished ? 'Published' : 'Draft'}
                        </span>
                    </div>
                    <p>${form.description || 'No description'}</p>
                    <div class="form-card__meta">
                        <span>📅 ${new Date(form.createdAt).toLocaleDateString()}</span>
                        <span>📊 ${form.responses?.length || 0} responses</span>
                    </div>
                    <div class="form-card__actions">
                        <button class="btn btn--outline btn--sm" onclick="app.editForm('${form.id}')">
                            ✏️ Edit
                        </button>
                        <button class="btn btn--secondary btn--sm" onclick="app.previewForm('${form.id}')">
                            👁 Preview
                        </button>
                        <button class="btn btn--primary btn--sm" onclick="app.viewResults('${form.id}')">
                            📊 Results
                        </button>
                    </div>
                </div>
            </div>
        `).join('');
    }

    // Form Builder
    createNewForm() {
        this.currentForm = {
            id: 'form_' + Date.now(),
            title: 'Untitled Form',
            description: '',
            pages: [{
                id: 'page_1',
                title: 'Page 1',
                fields: []
            }],
            isPublished: false,
            createdAt: new Date().toISOString(),
            responses: []
        };
        
        this.showView('builder');
        this.initFormBuilder();
    }

    editForm(formId) {
        this.currentForm = this.forms.find(f => f.id === formId);
        if (this.currentForm) {
            this.showView('builder');
            this.initFormBuilder();
        }
    }

    initFormBuilder() {
        document.getElementById('formTitle').value = this.currentForm.title;
        this.renderFormCanvas();
        this.clearProperties();
        // Setup drag and drop after a delay to ensure DOM is ready
        setTimeout(() => this.setupDragAndDrop(), 300);
    }

    renderFormCanvas() {
        const canvas = document.getElementById('formCanvas');
        const fields = this.currentForm.pages[0]?.fields || [];

        if (fields.length === 0) {
            canvas.innerHTML = `
                <div class="canvas-placeholder">
                    <h3>Drop fields here to build your form</h3>
                    <p>Drag field types from the left sidebar to start building</p>
                </div>
            `;
        } else {
            canvas.innerHTML = fields.map(field => this.renderFormField(field)).join('');
        }

        // Re-setup canvas drop events after rendering
        this.setupCanvasEvents();
    }

    renderFormField(field) {
        return `
            <div class="form-field" data-field-id="${field.id}" onclick="app.selectField('${field.id}')">
                <div class="form-field__header">
                    <div>
                        <span class="form-field__label">${field.label}</span>
                        ${field.required ? '<span class="form-field__required">*</span>' : ''}
                    </div>
                    <div class="form-field__actions">
                        <button class="field-action-btn" onclick="app.deleteField('${field.id}'); event.stopPropagation();">
                            🗑️
                        </button>
                    </div>
                </div>
                <div class="form-field__input">
                    ${this.renderFieldInput(field)}
                </div>
            </div>
        `;
    }

    renderFieldInput(field) {
        switch (field.type) {
            case 'text':
                return `<input type="text" class="form-control" placeholder="${field.placeholder || ''}" disabled>`;
            case 'email':
                return `<input type="email" class="form-control" placeholder="${field.placeholder || ''}" disabled>`;
            case 'number':
                return `<input type="number" class="form-control" placeholder="${field.placeholder || ''}" disabled>`;
            case 'select':
                const options = field.options || ['Option 1', 'Option 2'];
                return `
                    <select class="form-control" disabled>
                        <option>Select an option</option>
                        ${options.map(opt => `<option>${opt}</option>`).join('')}
                    </select>
                `;
            case 'checkbox':
                const checkboxOptions = field.options || ['Option 1', 'Option 2'];
                return checkboxOptions.map(opt => `
                    <label class="checkbox-item" style="display: block; margin-bottom: 8px;">
                        <input type="checkbox" disabled> ${opt}
                    </label>
                `).join('');
            case 'rating':
                return `
                    <div class="rating-field">
                        ${[1,2,3,4,5].map(i => `<span class="rating-star">⭐</span>`).join('')}
                    </div>
                `;
            default:
                return `<input type="text" class="form-control" disabled>`;
        }
    }

    setupDragAndDrop() {
        console.log('Setting up drag and drop...');
        
        // Setup field type drag events
        const fieldTypes = document.querySelectorAll('.field-type');
        console.log('Found field types:', fieldTypes.length);

        fieldTypes.forEach((fieldType, index) => {
            console.log(`Setting up field type ${index}:`, fieldType.dataset.type);
            
            // Remove any existing event listeners by cloning
            const newFieldType = fieldType.cloneNode(true);
            fieldType.parentNode.replaceChild(newFieldType, fieldType);
            
            // Set up fresh event listeners
            newFieldType.draggable = true;
            
            newFieldType.addEventListener('dragstart', (e) => {
                console.log('Dragstart event:', newFieldType.dataset.type);
                e.dataTransfer.setData('text/plain', newFieldType.dataset.type);
                e.dataTransfer.effectAllowed = 'copy';
                newFieldType.style.opacity = '0.5';
            });

            newFieldType.addEventListener('dragend', (e) => {
                console.log('Dragend event');
                newFieldType.style.opacity = '1';
            });

            // Add click handler as fallback for touch devices
            newFieldType.addEventListener('click', (e) => {
                console.log('Click fallback for:', newFieldType.dataset.type);
                this.addField(newFieldType.dataset.type);
            });
        });

        this.setupCanvasEvents();
    }

    setupCanvasEvents() {
        const canvas = document.getElementById('formCanvas');
        if (!canvas) return;

        // Remove existing event listeners by cloning
        const newCanvas = canvas.cloneNode(true);
        canvas.parentNode.replaceChild(newCanvas, canvas);

        console.log('Setting up canvas events...');

        newCanvas.addEventListener('dragover', (e) => {
            e.preventDefault();
            e.dataTransfer.dropEffect = 'copy';
            newCanvas.classList.add('drag-over');
            console.log('Dragover canvas');
        });

        newCanvas.addEventListener('dragleave', (e) => {
            if (!newCanvas.contains(e.relatedTarget)) {
                newCanvas.classList.remove('drag-over');
                console.log('Dragleave canvas');
            }
        });

        newCanvas.addEventListener('drop', (e) => {
            e.preventDefault();
            newCanvas.classList.remove('drag-over');
            
            const fieldType = e.dataTransfer.getData('text/plain');
            console.log('Drop event on canvas, field type:', fieldType);
            
            if (fieldType) {
                this.addField(fieldType);
            }
        });

        console.log('Canvas events setup complete');
    }

    addField(type) {
        console.log('Adding field of type:', type);
        
        if (!this.currentForm) {
            console.error('No current form');
            this.showToast('Error: No form selected', 'error');
            return;
        }

        if (!this.currentForm.pages || !this.currentForm.pages[0]) {
            this.currentForm.pages = [{
                id: 'page_1',
                title: 'Page 1',
                fields: []
            }];
        }

        const fieldId = 'field_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        const newField = {
            id: fieldId,
            type: type,
            label: this.getFieldLabel(type),
            required: false,
            placeholder: `Enter ${this.getFieldLabel(type).toLowerCase()}`
        };

        if (type === 'select' || type === 'checkbox') {
            newField.options = ['Option 1', 'Option 2'];
        }

        this.currentForm.pages[0].fields.push(newField);
        console.log('Field added:', newField);
        console.log('Total fields now:', this.currentForm.pages[0].fields.length);
        
        this.renderFormCanvas();
        setTimeout(() => {
            this.selectField(fieldId);
        }, 100);
        
        this.showToast(`${this.getFieldLabel(type)} added to form`, 'success');
    }

    getFieldLabel(type) {
        const labels = {
            text: 'Text Input',
            email: 'Email Address',
            number: 'Number',
            select: 'Dropdown',
            checkbox: 'Checkbox',
            rating: 'Rating'
        };
        return labels[type] || 'Field';
    }

    selectField(fieldId) {
        // Remove previous selection
        document.querySelectorAll('.form-field').forEach(field => {
            field.classList.remove('selected');
        });

        // Select new field
        const fieldElement = document.querySelector(`[data-field-id="${fieldId}"]`);
        if (fieldElement) {
            fieldElement.classList.add('selected');
            this.selectedField = this.currentForm.pages[0].fields.find(f => f.id === fieldId);
            this.showFieldProperties();
        }
    }

    deleteField(fieldId) {
        this.currentForm.pages[0].fields = this.currentForm.pages[0].fields.filter(f => f.id !== fieldId);
        this.renderFormCanvas();
        this.clearProperties();
        this.showToast('Field deleted', 'info');
    }

    showFieldProperties() {
        if (!this.selectedField) return;

        const content = document.getElementById('propertiesContent');
        const field = this.selectedField;

        content.innerHTML = `
            <div class="property-group">
                <label class="form-label">Label</label>
                <input type="text" class="form-control" value="${field.label}" 
                       onchange="app.updateFieldProperty('label', this.value)">
            </div>
            
            <div class="property-group">
                <label class="form-label">Placeholder</label>
                <input type="text" class="form-control" value="${field.placeholder || ''}" 
                       onchange="app.updateFieldProperty('placeholder', this.value)">
            </div>
            
            <div class="property-group">
                <label class="form-label">
                    <input type="checkbox" ${field.required ? 'checked' : ''} 
                           onchange="app.updateFieldProperty('required', this.checked)"> Required
                </label>
            </div>

            ${field.type === 'select' || field.type === 'checkbox' ? this.renderOptionsEditor() : ''}
        `;
    }

    renderOptionsEditor() {
        const options = this.selectedField.options || [];
        return `
            <div class="property-group">
                <label class="form-label">Options</label>
                <div class="options-list">
                    ${options.map((option, index) => `
                        <div class="option-item">
                            <input type="text" class="form-control" value="${option}" 
                                   onchange="app.updateOption(${index}, this.value)">
                            <button class="remove-option" onclick="app.removeOption(${index})">✕</button>
                        </div>
                    `).join('')}
                </div>
                <button class="btn btn--outline btn--sm" onclick="app.addOption()">+ Add Option</button>
            </div>
        `;
    }

    updateFieldProperty(property, value) {
        if (this.selectedField) {
            this.selectedField[property] = value;
            this.renderFormCanvas();
            setTimeout(() => {
                this.selectField(this.selectedField.id);
            }, 100);
        }
    }

    updateOption(index, value) {
        if (this.selectedField && this.selectedField.options) {
            this.selectedField.options[index] = value;
            this.renderFormCanvas();
        }
    }

    addOption() {
        if (this.selectedField) {
            if (!this.selectedField.options) this.selectedField.options = [];
            this.selectedField.options.push('New Option');
            this.showFieldProperties();
            this.renderFormCanvas();
        }
    }

    removeOption(index) {
        if (this.selectedField && this.selectedField.options) {
            this.selectedField.options.splice(index, 1);
            this.showFieldProperties();
            this.renderFormCanvas();
        }
    }

    clearProperties() {
        document.getElementById('propertiesContent').innerHTML = '<p>Select a field to edit its properties</p>';
        this.selectedField = null;
    }

    saveForm() {
        if (!this.currentForm) return;

        this.currentForm.title = document.getElementById('formTitle').value;
        
        const existingIndex = this.forms.findIndex(f => f.id === this.currentForm.id);
        if (existingIndex >= 0) {
            this.forms[existingIndex] = this.currentForm;
        } else {
            this.forms.push(this.currentForm);
        }

        this.saveData();
        this.showToast('Form saved successfully!', 'success');
    }

    // Preview
    previewForm(formId) {
        if (formId) {
            this.currentForm = this.forms.find(f => f.id === formId);
        }
        
        if (!this.currentForm) return;

        this.showView('preview');
        this.renderFormPreview();
    }

    renderFormPreview() {
        const container = document.getElementById('formPreview');
        const form = this.currentForm;

        container.innerHTML = `
            <div class="form-header">
                <h2>${form.title}</h2>
                ${form.description ? `<p>${form.description}</p>` : ''}
            </div>
            <form id="previewForm">
                ${form.pages[0].fields.map(field => `
                    <div class="form-group">
                        <label class="form-label">
                            ${field.label}
                            ${field.required ? '<span style="color: var(--color-error);">*</span>' : ''}
                        </label>
                        ${this.renderPublicFieldInput(field)}
                    </div>
                `).join('')}
                <button type="submit" class="btn btn--primary">Submit</button>
            </form>
        `;
    }

    // Publishing
    showPublishModal() {
        if (!this.currentForm) return;

        const modal = document.getElementById('publishModal');
        const shareableLink = `${window.location.origin}${window.location.pathname}?form=${this.currentForm.id}`;
        document.getElementById('shareableLink').value = shareableLink;
        
        modal.style.display = 'block';
    }

    publishForm() {
        if (!this.currentForm) return;

        this.currentForm.isPublished = true;
        this.currentForm.status = document.getElementById('formStatus').value;
        
        this.saveForm();
        this.hidePublishModal();
        this.showToast('Form published successfully!', 'success');
    }

    hidePublishModal() {
        document.getElementById('publishModal').style.display = 'none';
    }

    copyShareableLink() {
        const linkInput = document.getElementById('shareableLink');
        linkInput.select();
        navigator.clipboard.writeText(linkInput.value).then(() => {
            this.showToast('Link copied to clipboard!', 'success');
        }).catch(() => {
            // Fallback for older browsers
            document.execCommand('copy');
            this.showToast('Link copied to clipboard!', 'success');
        });
    }

    // Public Form
    loadPublicForm(formId) {
        const form = this.forms.find(f => f.id === formId);
        if (!form || !form.isPublished) {
            this.showToast('Form not found or not published', 'error');
            return;
        }

        this.currentForm = form;
        this.showView('publicForm');
        this.renderPublicForm();
    }

    renderPublicForm() {
        const headerContainer = document.getElementById('publicFormHeader');
        const formContainer = document.getElementById('publicFormContainer');
        const form = this.currentForm;

        headerContainer.innerHTML = `
            <h1>${form.title}</h1>
            ${form.description ? `<p>${form.description}</p>` : ''}
        `;

        formContainer.innerHTML = `
            <form id="publicSubmissionForm">
                ${form.pages[0].fields.map(field => `
                    <div class="form-group">
                        <label class="form-label">
                            ${field.label}
                            ${field.required ? '<span style="color: var(--color-error);">*</span>' : ''}
                        </label>
                        ${this.renderPublicFieldInput(field)}
                    </div>
                `).join('')}
                <button type="submit" class="btn btn--primary btn--full-width">Submit Response</button>
            </form>
        `;

        document.getElementById('publicSubmissionForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.submitPublicForm();
        });
    }

    renderPublicFieldInput(field) {
        switch (field.type) {
            case 'text':
                return `<input type="text" name="${field.id}" class="form-control" 
                               placeholder="${field.placeholder || ''}" ${field.required ? 'required' : ''}>`;
            case 'email':
                return `<input type="email" name="${field.id}" class="form-control" 
                               placeholder="${field.placeholder || ''}" ${field.required ? 'required' : ''}>`;
            case 'number':
                return `<input type="number" name="${field.id}" class="form-control" 
                               placeholder="${field.placeholder || ''}" ${field.required ? 'required' : ''}>`;
            case 'select':
                const options = field.options || [];
                return `
                    <select name="${field.id}" class="form-control" ${field.required ? 'required' : ''}>
                        <option value="">Select an option</option>
                        ${options.map(opt => `<option value="${opt}">${opt}</option>`).join('')}
                    </select>
                `;
            case 'checkbox':
                const checkboxOptions = field.options || [];
                return checkboxOptions.map(opt => `
                    <label class="checkbox-item" style="display: block; margin-bottom: 8px;">
                        <input type="checkbox" name="${field.id}" value="${opt}"> ${opt}
                    </label>
                `).join('');
            case 'rating':
                return `
                    <div class="rating-field">
                        ${[1,2,3,4,5].map(i => `
                            <span class="rating-star" data-value="${i}" onclick="app.setRating('${field.id}', ${i})">⭐</span>
                        `).join('')}
                        <input type="hidden" name="${field.id}" id="rating_${field.id}">
                    </div>
                `;
            default:
                return `<input type="text" name="${field.id}" class="form-control">`;
        }
    }

    setRating(fieldId, value) {
        document.getElementById(`rating_${fieldId}`).value = value;
        
        // Update visual feedback
        const stars = document.querySelectorAll(`[onclick*="${fieldId}"]`);
        stars.forEach((star, index) => {
            if (index < value) {
                star.style.color = '#fbbf24';
            } else {
                star.style.color = 'var(--color-border)';
            }
        });
    }

    submitPublicForm() {
        const form = document.getElementById('publicSubmissionForm');
        const formData = new FormData(form);
        const response = {
            id: 'response_' + Date.now(),
            formId: this.currentForm.id,
            data: {},
            submittedAt: new Date().toISOString()
        };

        // Collect checkbox values
        this.currentForm.pages[0].fields.forEach(field => {
            if (field.type === 'checkbox') {
                const checkboxes = form.querySelectorAll(`input[name="${field.id}"]:checked`);
                response.data[field.id] = Array.from(checkboxes).map(cb => cb.value);
            }
        });

        // Collect other field values
        for (let [key, value] of formData.entries()) {
            if (!response.data[key]) {
                response.data[key] = value;
            }
        }

        this.responses.push(response);
        this.saveData();

        // Show thank you message
        document.getElementById('publicFormContainer').innerHTML = `
            <div class="text-center">
                <h2>✅ Thank you!</h2>
                <p>Your response has been submitted successfully.</p>
            </div>
        `;

        this.showToast('Response submitted successfully!', 'success');
    }

    // Results
    loadResults() {
        this.populateFormSelector();
    }

    populateFormSelector() {
        const selector = document.getElementById('formSelector');
        selector.innerHTML = '<option value="">Select a form</option>' +
            this.forms.map(form => `<option value="${form.id}">${form.title}</option>`).join('');
    }

    viewResults(formId) {
        this.showView('results');
        setTimeout(() => {
            document.getElementById('formSelector').value = formId;
            this.loadFormResults(formId);
        }, 100);
    }

    loadFormResults(formId) {
        const form = this.forms.find(f => f.id === formId);
        const formResponses = this.responses.filter(r => r.formId === formId);
        
        if (!form) return;

        document.getElementById('resultsContent').style.display = 'block';
        document.getElementById('responseCount').textContent = formResponses.length;
        
        this.renderResponsesTable(form, formResponses);
        this.renderCharts(form, formResponses);
    }

    renderResponsesTable(form, responses) {
        const table = document.getElementById('responsesTable');
        const fields = form.pages[0].fields;

        if (responses.length === 0) {
            table.innerHTML = `
                <thead>
                    <tr><th>No responses yet</th></tr>
                </thead>
                <tbody>
                    <tr><td>Submit the form to see responses here</td></tr>
                </tbody>
            `;
            return;
        }

        table.innerHTML = `
            <thead>
                <tr>
                    <th>Submitted At</th>
                    ${fields.map(field => `<th>${field.label}</th>`).join('')}
                </tr>
            </thead>
            <tbody>
                ${responses.map(response => `
                    <tr>
                        <td>${new Date(response.submittedAt).toLocaleString()}</td>
                        ${fields.map(field => `
                            <td>${this.formatResponseValue(response.data[field.id], field.type)}</td>
                        `).join('')}
                    </tr>
                `).join('')}
            </tbody>
        `;
    }

    formatResponseValue(value, type) {
        if (!value) return '-';
        if (type === 'checkbox' && Array.isArray(value)) {
            return value.join(', ');
        }
        return value;
    }

    renderCharts(form, responses) {
        const chartsGrid = document.getElementById('chartsGrid');
        const fields = form.pages[0].fields;
        
        chartsGrid.innerHTML = '';

        if (responses.length === 0) {
            chartsGrid.innerHTML = '<p>No data to display charts. Submit some responses first.</p>';
            return;
        }

        fields.forEach(field => {
            if (field.type === 'select' || field.type === 'checkbox' || field.type === 'rating') {
                this.createCategoricalChart(field, responses, chartsGrid);
            } else if (field.type === 'number') {
                this.createNumericalChart(field, responses, chartsGrid);
            }
        });
    }

    createCategoricalChart(field, responses, container) {
        const chartContainer = document.createElement('div');
        chartContainer.className = 'chart-container';
        chartContainer.innerHTML = `
            <h3>${field.label}</h3>
            <div class="chart-wrapper">
                <canvas id="chart_${field.id}"></canvas>
            </div>
        `;
        container.appendChild(chartContainer);

        // Prepare data
        const valueCounts = {};
        responses.forEach(response => {
            const value = response.data[field.id];
            if (value) {
                if (Array.isArray(value)) {
                    value.forEach(v => {
                        valueCounts[v] = (valueCounts[v] || 0) + 1;
                    });
                } else {
                    valueCounts[value] = (valueCounts[value] || 0) + 1;
                }
            }
        });

        const ctx = document.getElementById(`chart_${field.id}`).getContext('2d');
        new Chart(ctx, {
            type: 'bar',
            data: {
                labels: Object.keys(valueCounts),
                datasets: [{
                    label: 'Responses',
                    data: Object.values(valueCounts),
                    backgroundColor: ['#1FB8CD', '#FFC185', '#B4413C', '#ECEBD5', '#5D878F'],
                    borderColor: ['#1FB8CD', '#FFC185', '#B4413C', '#ECEBD5', '#5D878F'],
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            stepSize: 1
                        }
                    }
                }
            }
        });
    }

    createNumericalChart(field, responses, container) {
        const chartContainer = document.createElement('div');
        chartContainer.className = 'chart-container';
        chartContainer.innerHTML = `
            <h3>${field.label}</h3>
            <div class="chart-wrapper">
                <canvas id="chart_${field.id}"></canvas>
            </div>
        `;
        container.appendChild(chartContainer);

        // Prepare data
        const values = responses
            .map(response => parseFloat(response.data[field.id]))
            .filter(value => !isNaN(value));

        if (values.length === 0) return;

        // Create histogram bins
        const min = Math.min(...values);
        const max = Math.max(...values);
        const binCount = Math.min(10, Math.ceil(Math.sqrt(values.length)));
        const binSize = (max - min) / binCount || 1;
        
        const bins = Array.from({length: binCount}, (_, i) => ({
            label: `${(min + i * binSize).toFixed(1)}-${(min + (i + 1) * binSize).toFixed(1)}`,
            count: 0
        }));

        values.forEach(value => {
            const binIndex = Math.min(Math.floor((value - min) / binSize), binCount - 1);
            bins[binIndex].count++;
        });

        const ctx = document.getElementById(`chart_${field.id}`).getContext('2d');
        new Chart(ctx, {
            type: 'bar',
            data: {
                labels: bins.map(bin => bin.label),
                datasets: [{
                    label: 'Frequency',
                    data: bins.map(bin => bin.count),
                    backgroundColor: '#1FB8CD',
                    borderColor: '#1FB8CD',
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            stepSize: 1
                        }
                    }
                }
            }
        });
    }

    exportCSV(formId) {
        const form = this.forms.find(f => f.id === formId);
        const responses = this.responses.filter(r => r.formId === formId);
        
        if (!form || responses.length === 0) {
            this.showToast('No data to export', 'info');
            return;
        }

        const fields = form.pages[0].fields;
        const headers = ['Submitted At', ...fields.map(f => f.label)];
        
        const csvContent = [
            headers.join(','),
            ...responses.map(response => [
                new Date(response.submittedAt).toISOString(),
                ...fields.map(field => {
                    const value = response.data[field.id];
                    if (Array.isArray(value)) {
                        return `"${value.join('; ')}"`;
                    }
                    return `"${value || ''}"`;
                })
            ].join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${form.title}_responses.csv`;
        a.click();
        window.URL.revokeObjectURL(url);

        this.showToast('CSV exported successfully!', 'success');
    }

    // Utility Functions
    setupTheme() {
        const savedTheme = localStorage.getItem('formulate_theme') || 'light';
        this.setTheme(savedTheme);
    }

    toggleTheme() {
        const currentTheme = document.documentElement.dataset.colorScheme || 'light';
        const newTheme = currentTheme === 'light' ? 'dark' : 'light';
        this.setTheme(newTheme);
    }

    setTheme(theme) {
        document.documentElement.dataset.colorScheme = theme;
        localStorage.setItem('formulate_theme', theme);
        
        const themeToggle = document.getElementById('themeToggle');
        if (themeToggle) {
            themeToggle.textContent = theme === 'light' ? '🌙' : '☀️';
        }
    }

    showToast(message, type = 'info') {
        const container = document.getElementById('toastContainer');
        const toast = document.createElement('div');
        toast.className = `toast toast--${type}`;
        toast.textContent = message;
        
        container.appendChild(toast);
        
        setTimeout(() => {
            toast.remove();
        }, 4000);
    }

    // Event Bindings
    bindEvents() {
        // Login
        document.getElementById('loginForm').addEventListener('submit', (e) => {
            e.preventDefault();
            const email = document.getElementById('loginEmail').value;
            const password = document.getElementById('loginPassword').value;
            this.login(email, password);
        });

        // Navigation
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                this.showView(btn.dataset.view);
            });
        });

        // Header actions
        document.getElementById('logoutBtn').addEventListener('click', () => {
            this.logout();
        });

        document.getElementById('themeToggle').addEventListener('click', () => {
            this.toggleTheme();
        });

        // Dashboard
        document.getElementById('createFormBtn').addEventListener('click', () => {
            this.createNewForm();
        });

        // Builder
        document.getElementById('backToDashboard').addEventListener('click', () => {
            this.showView('dashboard');
        });

        document.getElementById('saveFormBtn').addEventListener('click', () => {
            this.saveForm();
        });

        document.getElementById('previewBtn').addEventListener('click', () => {
            this.previewForm();
        });

        document.getElementById('publishBtn').addEventListener('click', () => {
            this.showPublishModal();
        });

        // Preview
        document.getElementById('backToBuilder').addEventListener('click', () => {
            this.showView('builder');
        });

        document.getElementById('copyLinkBtn').addEventListener('click', () => {
            this.copyShareableLink();
        });

        // Publish Modal
        document.getElementById('closePublishModal').addEventListener('click', () => {
            this.hidePublishModal();
        });

        document.getElementById('cancelPublish').addEventListener('click', () => {
            this.hidePublishModal();
        });

        document.getElementById('confirmPublish').addEventListener('click', () => {
            this.publishForm();
        });

        document.getElementById('copyShareLink').addEventListener('click', () => {
            this.copyShareableLink();
        });

        document.getElementById('requirePassword').addEventListener('change', (e) => {
            document.getElementById('formPassword').disabled = !e.target.checked;
        });

        // Results
        document.getElementById('formSelector').addEventListener('change', (e) => {
            if (e.target.value) {
                this.loadFormResults(e.target.value);
            } else {
                document.getElementById('resultsContent').style.display = 'none';
            }
        });

        document.getElementById('exportBtn').addEventListener('click', () => {
            const formId = document.getElementById('formSelector').value;
            if (formId) {
                this.exportCSV(formId);
            } else {
                this.showToast('Please select a form first', 'info');
            }
        });

        // Check for public form in URL
        const urlParams = new URLSearchParams(window.location.search);
        const formId = urlParams.get('form');
        if (formId) {
            this.loadPublicForm(formId);
        }
    }
}

// Initialize the application
const app = new FormulateApp();