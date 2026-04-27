// 数据结构定义
class Task {
    constructor(id, date, title, done = false) {
        this.id = id;
        this.date = date;
        this.title = title;
        this.done = done;
        this.createdAt = Date.now();
    }
}

class Range {
    constructor(startDate, endDate) {
        this.startDate = startDate;
        this.endDate = endDate;
    }
}

// 全局状态
const state = {
    tasks: [],
    selectedDate: new Date().toISOString().slice(0, 10),
    currentMonth: new Date(),
    range: null,
    isSelectingRange: false,
    rangeStart: null
};

// DOM元素
const elements = {
    calendarGrid: document.getElementById('calendarGrid'),
    currentMonth: document.getElementById('currentMonth'),
    taskDate: document.getElementById('taskDate'),
    taskList: document.getElementById('taskList'),
    addTaskBtn: document.getElementById('addTaskBtn'),
    rangePanel: document.getElementById('rangePanel'),
    rangeInfo: document.getElementById('rangeInfo'),
    closeRangePanel: document.getElementById('closeRangePanel'),
    batchAddBtn: document.getElementById('batchAddBtn'),
    batchCompleteBtn: document.getElementById('batchCompleteBtn'),
    batchDeleteBtn: document.getElementById('batchDeleteBtn'),
    todayBtn: document.getElementById('todayBtn'),
    exportBtn: document.getElementById('exportBtn'),
    importBtn: document.getElementById('importBtn'),
    exportImportModal: document.getElementById('exportImportModal'),
    exportImportTitle: document.getElementById('exportImportTitle'),
    exportImportText: document.getElementById('exportImportText'),
    exportImportInfo: document.getElementById('exportImportInfo'),
    closeExportImportModal: document.getElementById('closeExportImportModal'),
    cancelExportImport: document.getElementById('cancelExportImport'),
    confirmExportImport: document.getElementById('confirmExportImport'),
    batchAddModal: document.getElementById('batchAddModal'),
    modalRangeInfo: document.getElementById('modalRangeInfo'),
    taskInput: document.getElementById('taskInput'),
    closeBatchAddModal: document.getElementById('closeBatchAddModal'),
    cancelBatchAdd: document.getElementById('cancelBatchAdd'),
    confirmBatchAdd: document.getElementById('confirmBatchAdd'),
    confirmModal: document.getElementById('confirmModal'),
    confirmTitle: document.getElementById('confirmTitle'),
    confirmMessage: document.getElementById('confirmMessage'),
    closeConfirmModal: document.getElementById('closeConfirmModal'),
    cancelConfirm: document.getElementById('cancelConfirm'),
    confirmAction: document.getElementById('confirmAction'),
    addTaskModal: document.getElementById('addTaskModal'),
    singleTaskInput: document.getElementById('singleTaskInput'),
    closeAddTaskModal: document.getElementById('closeAddTaskModal'),
    cancelAddTask: document.getElementById('cancelAddTask'),
    confirmAddTask: document.getElementById('confirmAddTask'),
    overlay: document.getElementById('overlay'),
    prevMonthBtn: document.querySelector('.month-nav.prev'),
    nextMonthBtn: document.querySelector('.month-nav.next')
};

// 工具函数
function uuid() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        const r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

function getDatesInRange(start, end) {
    const dates = [];
    let current = new Date(start);
    const last = new Date(end);

    while (current <= last) {
        dates.push(current.toISOString().slice(0, 10));
        current.setDate(current.getDate() + 1);
    }

    return dates;
}

function formatDate(dateString) {
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const day = date.getDate();
    const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
    const weekday = weekdays[date.getDay()];
    return `${year}年${month}月${day}日 ${weekday}`;
}

function getMonthName(date) {
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    return `${year}年${month}月`;
}

// 数据存储
function saveTasks() {
    localStorage.setItem('tasks', JSON.stringify(state.tasks));
}

function loadTasks() {
    const savedTasks = localStorage.getItem('tasks');
    if (savedTasks) {
        state.tasks = JSON.parse(savedTasks).map(task => new Task(task.id, task.date, task.title, task.done));
    }
}

// 日历生成
function generateCalendar(year, month) {
    elements.calendarGrid.innerHTML = '';
    
    // 生成星期标题
    const weekdays = ['日', '一', '二', '三', '四', '五', '六'];
    weekdays.forEach(day => {
        const dayElement = document.createElement('div');
        dayElement.className = 'calendar-day weekday';
        dayElement.textContent = day;
        dayElement.style.fontWeight = '600';
        dayElement.style.color = '#6B7280';
        dayElement.style.cursor = 'default';
        elements.calendarGrid.appendChild(dayElement);
    });

    // 计算当月第一天是星期几
    const firstDay = new Date(year, month - 1, 1);
    const startDay = firstDay.getDay();
    
    // 计算当月有多少天
    const daysInMonth = new Date(year, month, 0).getDate();
    
    // 生成上个月的部分日期
    const prevMonthDays = startDay;
    const prevMonth = month - 1 || 12;
    const prevYear = month === 1 ? year - 1 : year;
    const prevMonthDaysInMonth = new Date(prevYear, prevMonth, 0).getDate();
    
    for (let i = 0; i < prevMonthDays; i++) {
        const day = prevMonthDaysInMonth - prevMonthDays + i + 1;
        const dateString = `${prevYear}-${prevMonth.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
        const dayElement = document.createElement('div');
        dayElement.className = 'calendar-day other-month';
        dayElement.textContent = day;
        dayElement.dataset.date = dateString;
        
        // 标记区间选择
        if (state.range) {
            if (dateString === state.range.startDate) {
                dayElement.classList.add('range-start');
            } else if (dateString === state.range.endDate) {
                dayElement.classList.add('range-end');
            } else if (dateString > state.range.startDate && dateString < state.range.endDate) {
                dayElement.classList.add('range-middle');
            }
        }
        
        // 检查是否有任务
        const hasTasks = state.tasks.some(task => task.date === dateString);
        if (hasTasks) {
            dayElement.classList.add('has-tasks');
        }
        
        // 添加事件监听
        dayElement.addEventListener('click', () => handleDayClick(dateString));
        dayElement.addEventListener('mousedown', () => handleDayMouseDown(dateString));
        dayElement.addEventListener('mouseenter', () => handleDayMouseEnter(dateString));
        dayElement.addEventListener('mouseup', (e) => handleDayMouseUp(e));
        // 触摸设备支持
        dayElement.addEventListener('touchstart', (e) => {
            e.preventDefault();
            handleDayMouseDown(dateString);
        });
        dayElement.addEventListener('touchmove', (e) => {
            e.preventDefault();
            if (state.isSelectingRange) {
                const touch = e.touches[0];
                const target = document.elementFromPoint(touch.clientX, touch.clientY);
                if (target && target.classList.contains('calendar-day') && target.dataset.date) {
                    handleDayMouseEnter(target.dataset.date);
                }
            }
        });
        dayElement.addEventListener('touchend', (e) => {
            e.preventDefault();
            handleDayMouseUp();
            if (state.isSelectingRange) {
                // 完成区间选择
                handleDayClick(dateString);
            } else {
                // 普通点击
                handleDayClick(dateString);
            }
        });
        
        elements.calendarGrid.appendChild(dayElement);
    }
    
    // 生成当月日期
    const today = new Date().toISOString().slice(0, 10);
    for (let day = 1; day <= daysInMonth; day++) {
        const dateString = `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
        const dayElement = document.createElement('div');
        dayElement.className = 'calendar-day';
        dayElement.textContent = day;
        dayElement.dataset.date = dateString;
        
        // 标记今天
        if (dateString === today) {
            dayElement.classList.add('today');
        }
        
        // 标记选中日期
        if (dateString === state.selectedDate) {
            dayElement.classList.add('selected');
        }
        
        // 标记区间选择
        if (state.range) {
            if (dateString === state.range.startDate) {
                dayElement.classList.add('range-start');
            } else if (dateString === state.range.endDate) {
                dayElement.classList.add('range-end');
            } else if (dateString > state.range.startDate && dateString < state.range.endDate) {
                dayElement.classList.add('range-middle');
            }
        }
        
        // 检查是否有任务
        const dayTasks = state.tasks.filter(task => task.date === dateString);
        if (dayTasks.length > 0) {
            const allCompleted = dayTasks.every(task => task.done);
            if (allCompleted) {
                dayElement.classList.add('tasks-completed');
            } else {
                dayElement.classList.add('has-tasks');
            }
        }
        
        // 添加事件监听
        dayElement.addEventListener('click', () => handleDayClick(dateString));
        dayElement.addEventListener('mousedown', () => handleDayMouseDown(dateString));
        dayElement.addEventListener('mouseenter', () => handleDayMouseEnter(dateString));
        dayElement.addEventListener('mouseup', (e) => handleDayMouseUp(e));
        // 触摸设备支持
        dayElement.addEventListener('touchstart', (e) => {
            e.preventDefault();
            handleDayMouseDown(dateString);
        });
        dayElement.addEventListener('touchmove', (e) => {
            e.preventDefault();
            if (state.isSelectingRange) {
                const touch = e.touches[0];
                const target = document.elementFromPoint(touch.clientX, touch.clientY);
                if (target && target.classList.contains('calendar-day') && target.dataset.date) {
                    handleDayMouseEnter(target.dataset.date);
                }
            }
        });
        dayElement.addEventListener('touchend', (e) => {
            e.preventDefault();
            handleDayMouseUp();
            if (state.isSelectingRange) {
                // 完成区间选择
                handleDayClick(dateString);
            } else {
                // 普通点击
                handleDayClick(dateString);
            }
        });
        
        elements.calendarGrid.appendChild(dayElement);
    }
    
    // 生成下个月的部分日期
    const totalCells = 42; // 6行7列
    const remainingCells = totalCells - (prevMonthDays + daysInMonth);
    const nextMonth = month + 1 > 12 ? 1 : month + 1;
    const nextYear = month === 12 ? year + 1 : year;
    
    for (let i = 1; i <= remainingCells; i++) {
        const dateString = `${nextYear}-${nextMonth.toString().padStart(2, '0')}-${i.toString().padStart(2, '0')}`;
        const dayElement = document.createElement('div');
        dayElement.className = 'calendar-day next-month'; // 使用next-month类名区分下个月
        dayElement.textContent = i;
        dayElement.dataset.date = dateString;
        
        // 标记区间选择
        if (state.range) {
            if (dateString === state.range.startDate) {
                dayElement.classList.add('range-start');
            } else if (dateString === state.range.endDate) {
                dayElement.classList.add('range-end');
            } else if (dateString > state.range.startDate && dateString < state.range.endDate) {
                dayElement.classList.add('range-middle');
            }
        }
        
        // 检查是否有任务
        const dayTasks = state.tasks.filter(task => task.date === dateString);
        if (dayTasks.length > 0) {
            const allCompleted = dayTasks.every(task => task.done);
            if (allCompleted) {
                dayElement.classList.add('tasks-completed');
            } else {
                dayElement.classList.add('has-tasks');
            }
        }
        
        // 添加事件监听
        dayElement.addEventListener('click', () => handleDayClick(dateString));
        dayElement.addEventListener('mousedown', () => handleDayMouseDown(dateString));
        dayElement.addEventListener('mouseenter', () => handleDayMouseEnter(dateString));
        dayElement.addEventListener('mouseup', (e) => handleDayMouseUp(e));
        // 触摸设备支持
        dayElement.addEventListener('touchstart', (e) => {
            e.preventDefault();
            handleDayMouseDown(dateString);
        });
        dayElement.addEventListener('touchend', (e) => {
            e.preventDefault();
            handleDayMouseUp();
            if (state.isSelectingRange) {
                handleDayClick(dateString);
            } else {
                handleDayClick(dateString);
            }
        });
        
        elements.calendarGrid.appendChild(dayElement);
    }
    
    // 更新当前月份显示
    elements.currentMonth.textContent = getMonthName(new Date(year, month - 1));
}

// 事件处理函数
function handleDayClick(dateString) {
    if (state.isSelectingRange) {
        // 完成区间选择
        state.range = new Range(state.rangeStart, dateString);
        state.isSelectingRange = false;
        updateRangePanel();
        generateCalendar(state.currentMonth.getFullYear(), state.currentMonth.getMonth() + 1);
    } else {
        // 选择单个日期
        state.selectedDate = dateString;
        state.range = null;
        hideRangePanel();
        generateCalendar(state.currentMonth.getFullYear(), state.currentMonth.getMonth() + 1);
        renderTasks();
    }
}

let longPressTimer = null;

function handleDayMouseDown(dateString) {
    // 开始长按计时器
    longPressTimer = setTimeout(() => {
        if (!state.isSelectingRange) {
            // 第一次长按：开始区间选择，设置开始日期
            state.isSelectingRange = true;
            state.rangeStart = dateString;
            state.range = new Range(dateString, dateString);
            generateCalendar(state.currentMonth.getFullYear(), state.currentMonth.getMonth() + 1);
        } else {
            // 第二次长按：完成区间选择，设置结束日期并弹出菜单
            if (dateString >= state.rangeStart) {
                // 结束日期必须大于等于开始日期
                state.range = new Range(state.rangeStart, dateString);
                state.isSelectingRange = false;
                updateRangePanel();
                generateCalendar(state.currentMonth.getFullYear(), state.currentMonth.getMonth() + 1);
            }
        }
    }, 500); // 500ms作为长按判断阈值
}

function handleDayMouseUp(e) {
    // 清除长按计时器
    if (longPressTimer) {
        clearTimeout(longPressTimer);
        longPressTimer = null;
    }
}

function handleDayClick(dateString) {
    // 清除长按计时器（防止点击时触发长按逻辑）
    if (longPressTimer) {
        clearTimeout(longPressTimer);
        longPressTimer = null;
    }
    
    if (!state.isSelectingRange) {
        // 选择单个日期（不在区间选择模式时）
        state.selectedDate = dateString;
        state.range = null;
        hideRangePanel();
        generateCalendar(state.currentMonth.getFullYear(), state.currentMonth.getMonth() + 1);
        renderTasks();
    }
}

function handleDayMouseEnter(dateString) {
    // 区间选择现在通过两次长按完成，不再使用拖拽
}

function updateRangePanel() {
    if (state.range) {
        const dates = getDatesInRange(state.range.startDate, state.range.endDate);
        const startFormatted = formatDate(state.range.startDate);
        const endFormatted = formatDate(state.range.endDate);
        elements.rangeInfo.textContent = `${startFormatted} - ${endFormatted}（${dates.length}天）`;
        elements.rangePanel.classList.add('show');
    } else {
        hideRangePanel();
    }
}

function hideRangePanel() {
    elements.rangePanel.classList.remove('show');
    // 清除区间选择状态，恢复日期样式
    state.range = null;
    generateCalendar(state.currentMonth.getFullYear(), state.currentMonth.getMonth() + 1);
}

// 任务管理
function renderTasks() {
    elements.taskDate.textContent = formatDate(state.selectedDate);
    
    const dayTasks = state.tasks.filter(task => task.date === state.selectedDate);
    
    if (dayTasks.length === 0) {
        elements.taskList.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">📅</div>
                <p class="empty-state-text">今天还没有任务</p>
                <p class="empty-state-subtext">点击 + 添加</p>
            </div>
        `;
        return;
    }
    
    elements.taskList.innerHTML = '';
    dayTasks.forEach(task => {
        const taskElement = document.createElement('div');
        taskElement.className = `task-item ${task.done ? 'completed' : ''}`;
        taskElement.dataset.taskId = task.id;
        
        taskElement.innerHTML = `
            <div class="task-checkbox ${task.done ? 'checked' : ''}" onclick="toggleTask('${task.id}')"></div>
            <div class="task-title">${task.title}</div>
            <button class="task-delete" onclick="deleteTask('${task.id}')">×</button>
        `;
        
        elements.taskList.appendChild(taskElement);
    });
}

function addTask(date, title) {
    if (!title.trim()) return;
    
    const task = new Task(uuid(), date, title.trim());
    state.tasks.push(task);
    saveTasks();
    renderTasks();
    generateCalendar(state.currentMonth.getFullYear(), state.currentMonth.getMonth() + 1);
}

function toggleTask(taskId) {
    const task = state.tasks.find(t => t.id === taskId);
    if (task) {
        task.done = !task.done;
        saveTasks();
        renderTasks();
        generateCalendar(state.currentMonth.getFullYear(), state.currentMonth.getMonth() + 1);
    }
}

function deleteTask(taskId) {
    state.tasks = state.tasks.filter(t => t.id !== taskId);
    saveTasks();
    renderTasks();
    generateCalendar(state.currentMonth.getFullYear(), state.currentMonth.getMonth() + 1);
}

// 批量操作
function batchCreateTasks(range, inputText) {
    const dates = getDatesInRange(range.startDate, range.endDate);
    
    const lines = inputText
        .split('\n')
        .map(l => l.trim())
        .filter(Boolean);
    
    const tasks = [];
    dates.forEach(date => {
        lines.forEach(title => {
            tasks.push(new Task(uuid(), date, title));
        });
    });
    
    state.tasks = [...state.tasks, ...tasks];
    saveTasks();
    return tasks.length;
}

function batchCompleteTasks(range) {
    const dates = getDatesInRange(range.startDate, range.endDate);
    let count = 0;
    
    state.tasks.forEach(task => {
        if (dates.includes(task.date) && !task.done) {
            task.done = true;
            count++;
        }
    });
    
    saveTasks();
    return count;
}

function batchDeleteTasks(range) {
    const dates = getDatesInRange(range.startDate, range.endDate);
    const initialLength = state.tasks.length;
    
    state.tasks = state.tasks.filter(task => !dates.includes(task.date));
    saveTasks();
    
    return initialLength - state.tasks.length;
}

// 模态框管理
function showModal(modal) {
    modal.classList.add('show');
    elements.overlay.classList.add('show');
}

function hideModal(modal) {
    modal.classList.remove('show');
    elements.overlay.classList.remove('show');
}

// 事件监听
function setupEventListeners() {
    // 月份导航（保持区间选择状态）
    elements.prevMonthBtn.addEventListener('click', () => {
        state.currentMonth.setMonth(state.currentMonth.getMonth() - 1);
        generateCalendar(state.currentMonth.getFullYear(), state.currentMonth.getMonth() + 1);
    });
    
    elements.nextMonthBtn.addEventListener('click', () => {
        state.currentMonth.setMonth(state.currentMonth.getMonth() + 1);
        generateCalendar(state.currentMonth.getFullYear(), state.currentMonth.getMonth() + 1);
    });
    
    // 添加任务按钮
    elements.addTaskBtn.addEventListener('click', () => {
        elements.singleTaskInput.value = '';
        showModal(elements.addTaskModal);
    });
    
    // 批量添加任务
    elements.batchAddBtn.addEventListener('click', () => {
        if (state.range) {
            const dates = getDatesInRange(state.range.startDate, state.range.endDate);
            const startFormatted = formatDate(state.range.startDate);
            const endFormatted = formatDate(state.range.endDate);
            elements.modalRangeInfo.textContent = `已选：${startFormatted} - ${endFormatted}（${dates.length}天）`;
            elements.taskInput.value = '';
            showModal(elements.batchAddModal);
        }
    });
    
    // 批量标记完成
    elements.batchCompleteBtn.addEventListener('click', () => {
        if (state.range) {
            elements.confirmTitle.textContent = '批量标记完成';
            elements.confirmMessage.textContent = '确定要将选中日期范围内的所有任务标记为完成吗？';
            elements.confirmAction.onclick = () => {
                const count = batchCompleteTasks(state.range);
                hideModal(elements.confirmModal);
                hideRangePanel();
                renderTasks();
                generateCalendar(state.currentMonth.getFullYear(), state.currentMonth.getMonth() + 1);
                alert(`已将 ${count} 个任务标记为完成`);
            };
            showModal(elements.confirmModal);
        }
    });
    
    // 批量删除
    elements.batchDeleteBtn.addEventListener('click', () => {
        if (state.range) {
            elements.confirmTitle.textContent = '批量删除';
            elements.confirmMessage.textContent = '确定要删除选中日期范围内的所有任务吗？此操作不可恢复。';
            elements.confirmAction.onclick = () => {
                const count = batchDeleteTasks(state.range);
                hideModal(elements.confirmModal);
                hideRangePanel();
                renderTasks();
                generateCalendar(state.currentMonth.getFullYear(), state.currentMonth.getMonth() + 1);
                alert(`已删除 ${count} 个任务`);
            };
            showModal(elements.confirmModal);
        }
    });
    
    // 批量添加任务弹窗
    elements.closeBatchAddModal.addEventListener('click', () => {
        hideModal(elements.batchAddModal);
    });
    
    elements.cancelBatchAdd.addEventListener('click', () => {
        hideModal(elements.batchAddModal);
    });
    
    elements.confirmBatchAdd.addEventListener('click', () => {
        if (state.range) {
            const taskCount = batchCreateTasks(state.range, elements.taskInput.value);
            hideModal(elements.batchAddModal);
            hideRangePanel();
            renderTasks();
            generateCalendar(state.currentMonth.getFullYear(), state.currentMonth.getMonth() + 1);
            alert(`已成功添加 ${taskCount} 个任务`);
        }
    });
    
    // 确认弹窗
    elements.closeConfirmModal.addEventListener('click', () => {
        hideModal(elements.confirmModal);
    });
    
    elements.cancelConfirm.addEventListener('click', () => {
        hideModal(elements.confirmModal);
    });
    
    // 添加任务弹窗
    elements.closeAddTaskModal.addEventListener('click', () => {
        hideModal(elements.addTaskModal);
    });
    
    elements.cancelAddTask.addEventListener('click', () => {
        hideModal(elements.addTaskModal);
    });
    
    elements.confirmAddTask.addEventListener('click', () => {
        const inputText = elements.singleTaskInput.value;
        const lines = inputText
            .split('\n')
            .map(l => l.trim())
            .filter(Boolean);
        
        if (lines.length > 0) {
            lines.forEach(title => {
                addTask(state.selectedDate, title);
            });
            hideModal(elements.addTaskModal);
        }
    });
    
    // 关闭区间面板
    elements.closeRangePanel.addEventListener('click', () => {
        hideRangePanel();
    });
    
    // 遮罩层点击
    elements.overlay.addEventListener('click', () => {
        hideModal(elements.batchAddModal);
        hideModal(elements.confirmModal);
        hideModal(elements.addTaskModal);
        hideModal(elements.exportImportModal);
    });
    
    // 点击空白区域退出区间选择或关闭区间面板（排除导航按钮和区间面板）
    document.addEventListener('click', (e) => {
        const isNavButton = elements.prevMonthBtn.contains(e.target) || elements.nextMonthBtn.contains(e.target);
        const isRangePanel = elements.rangePanel.contains(e.target);
        
        if (!elements.calendarGrid.contains(e.target) && !isNavButton && !isRangePanel) {
            // 如果在区间选择模式中，退出选择
            if (state.isSelectingRange) {
                state.isSelectingRange = false;
                state.range = null;
                generateCalendar(state.currentMonth.getFullYear(), state.currentMonth.getMonth() + 1);
            }
            
            // 如果区间面板显示，关闭它
            if (elements.rangePanel.classList.contains('show')) {
                hideRangePanel();
            }
        }
    });
    
    // 定位到今天
    elements.todayBtn.addEventListener('click', () => {
        const today = new Date();
        state.selectedDate = today.toISOString().slice(0, 10);
        state.currentMonth = new Date(today.getFullYear(), today.getMonth());
        state.range = null;
        hideRangePanel();
        generateCalendar(state.currentMonth.getFullYear(), state.currentMonth.getMonth() + 1);
        renderTasks();
    });
    
    // 导出任务
    elements.exportBtn.addEventListener('click', () => {
        const data = {
            tasks: state.tasks,
            exportDate: new Date().toISOString()
        };
        const jsonString = JSON.stringify(data, null, 2);
        
        // 显示导出弹窗
        elements.exportImportTitle.textContent = '导出任务';
        elements.exportImportText.value = jsonString;
        elements.exportImportInfo.textContent = `共 ${state.tasks.length} 个任务`;
        showModal(elements.exportImportModal);
        
        // 自动选择文本，方便用户复制
        elements.exportImportText.select();
        elements.exportImportText.setSelectionRange(0, 99999);
    });
    
    // 导入任务
    elements.importBtn.addEventListener('click', () => {
        // 显示导入弹窗
        elements.exportImportTitle.textContent = '导入任务';
        elements.exportImportText.value = '';
        elements.exportImportInfo.textContent = '请粘贴任务数据';
        showModal(elements.exportImportModal);
    });
    
    // 关闭导出导入弹窗
    elements.closeExportImportModal.addEventListener('click', () => {
        hideModal(elements.exportImportModal);
    });
    
    elements.cancelExportImport.addEventListener('click', () => {
        hideModal(elements.exportImportModal);
    });
    
    // 确认导出导入操作
    elements.confirmExportImport.addEventListener('click', () => {
        if (elements.exportImportTitle.textContent === '导入任务') {
            // 导入操作
            const jsonString = elements.exportImportText.value.trim();
            if (!jsonString) {
                alert('请输入任务数据');
                return;
            }
            
            try {
                const data = JSON.parse(jsonString);
                if (data.tasks && Array.isArray(data.tasks)) {
                    // 确认是否覆盖现有任务
                    if (confirm('导入任务将覆盖现有任务，确定要继续吗？')) {
                        state.tasks = data.tasks.map(task => new Task(task.id, task.date, task.title, task.done));
                        saveTasks();
                        generateCalendar(state.currentMonth.getFullYear(), state.currentMonth.getMonth() + 1);
                        renderTasks();
                        alert('任务导入成功！');
                        hideModal(elements.exportImportModal);
                    }
                } else {
                    alert('导入失败：数据格式不正确');
                }
            } catch (error) {
                alert('导入失败：数据格式错误');
            }
        } else {
            // 导出操作，点击确认只是关闭弹窗
            hideModal(elements.exportImportModal);
        }
    });
}

// 初始化
function init() {
    loadTasks();
    generateCalendar(state.currentMonth.getFullYear(), state.currentMonth.getMonth() + 1);
    renderTasks();
    setupEventListeners();
}

// 全局函数
globalThis.toggleTask = toggleTask;
globalThis.deleteTask = deleteTask;

// 启动应用
init();
