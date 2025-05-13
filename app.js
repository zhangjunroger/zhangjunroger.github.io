// LeanCloud 配置  
AV.init({  
    appId: "PeXHg9gv4y7OXBT718FEmrZj-gzGzoHsz",  // 替换为您的 LeanCloud 应用 ID  
    appKey: "dZH0g9anm4up0RNWL0iIqc2P", // 替换为您的 LeanCloud 应用 Key
    serverURL: 'https://avoscloud.com' // CN 服务地域特定的 URL
 //   masterKey: 'NN9e44P2DDaULOUxhvurUl7b' // 使用 Master Key  
});  

// Register function  
function register() {  
    const email = document.getElementById('email').value;  
    const password = document.getElementById('password').value;  
    const name = document.getElementById('name').value;  
    const employeeId = document.getElementById('employeeId').value;  

    const user = new AV.User();  
    user.setUsername(email);  
    user.setPassword(password);  
    user.setEmail(email);  
    user.set('name', name);  
    user.set('employeeId', employeeId);  

    user.signUp().then(() => {  
        alert('注册成功！');  
        document.getElementById('auth').style.display = 'none';  
        document.getElementById('booking').style.display = 'block';  
    }).catch(error => {  
        alert(error.message);  
    });  
}


// Login function  
function login() {  
    const email = document.getElementById('email').value;  
    const password = document.getElementById('password').value;  

    AV.User.logIn(email, password).then(() => {  
        alert('登录成功！');  
        document.getElementById('auth').style.display = 'none';  
        document.getElementById('booking').style.display = 'block';  
    }).catch(error => {  
        alert(error.message);  
    });  
}


// 删除用户功能  
function deleteUser() {  
    const email = document.getElementById('email').value;  
    const password = document.getElementById('password').value;  

    // 登录验证  
    AV.User.logIn(email, password).then(user => {  
        // 登录成功，确认删除  
        const confirmDelete = confirm("确定要删除您的账户吗？操作不可撤销！");  
        if (confirmDelete) {  
            user.destroy().then(() => {  
                alert('账户已成功删除！');  
                // 清除本地界面或重定向至主页  
                document.getElementById('auth').reset();  
            }).catch(error => {  
                alert('删除账户失败：' + error.message);  
            });  
        } else {  
            alert('已取消删除操作。');  
        }  
    }).catch(error => {  
        alert('登录失败：' + error.message);  
    });  
}  


// Book classroom function  
function bookClassroom() {  
    const dateInput = document.getElementById('date').value;  
    const period = document.getElementById('period').value;  
    const classroom = document.getElementById('classroom').value;  
    const user = AV.User.current();  

    if (!user) {  
        alert('请先登录！');  
        return;  
    }  

    const selectedDate = new Date(dateInput);  
    const now = new Date();  
    
    if (isNaN(selectedDate)) {  
        alert('请选择一个有效的日期！');  
        return;  
    }  
    
    if (selectedDate < now.setHours(0, 0, 0, 0)) {  
        alert('不能预定历史日期，请选择一个正确日期！');  
        return;  
    }  

    const Booking = AV.Object.extend('Booking');  
    const query = new AV.Query('Booking');  
    query.equalTo('date', dateInput);  
    query.equalTo('period', period);  
    query.equalTo('classroom', classroom);  

    query.first().then(existingBooking => {  
        if (existingBooking) {  
            alert('当前日期节次该房间已被预定，请重新选择！');  
        } else {  
            const booking = new Booking();  
            booking.set('userId', user.id);  
            booking.set('name', user.get('name'));  // 存储用户姓名  
            booking.set('employeeId', user.get('employeeId'));  // 存储员工 ID  
            booking.set('date', dateInput);  
            booking.set('period', period);  
            booking.set('classroom', classroom);  

            booking.save().then(() => {  
                alert('房间预定成功！');  
            }).catch(error => {  
                alert(error.message);  
            });  
        }  
    }).catch(error => {  
        alert('检查房间预定冲突时出错：' + error.message);  
    });  
}

// 查看预定情况
function checknow() {  
    const bookingTableBody = document.getElementById('booking-entries').querySelector('tbody');  
    if (!bookingTableBody) {  
        console.error('Element not found: #booking-entries tbody');  
        return;  
    }  
    bookingTableBody.innerHTML = ''; // 清空当前表格内容  

    const now = new Date();  
    now.setHours(0, 0, 0, 0); // 设定为当天的零点以避免时间误差  
    const query = new AV.Query('Booking');
    
    query.limit(1000); // 增加结果数量上限
    query.ascending('date'); // 确保按日期排序


    query.greaterThanOrEqualTo('date', now.toISOString().split('T')[0]);  
    query.find().then(results => {  
        if (results.length === 0) {  
            alert('没有找到相关预定数据。');  
            return;  
        }  
        const bookings = results.map(booking => {  
            const attributes = booking.attributes;  
            return {  
                id: booking.id,  
                ...attributes  
            };  
        });  

        bookings.sort((a, b) => new Date(a.date) - new Date(b.date));  

        let currentDisplayDate = '';  
        bookings.forEach(booking => {  
            console.log('Processing booking:', booking);  
            const formattedDate = new Date(booking.date).toISOString().split('T')[0]; // 格式化日期  

            if (formattedDate !== currentDisplayDate) {  
                currentDisplayDate = formattedDate;  
                const dateRow = document.createElement('tr');  
                dateRow.className = 'highlight';  
                dateRow.innerHTML = `<td colspan="7">${formattedDate} (${getWeekday(booking.date)})</td>`;  
                bookingTableBody.appendChild(dateRow);  
            }  

            const row = document.createElement('tr');  
            row.innerHTML = `  
                <td>${formattedDate}</td>  
                <td>${getWeekday(booking.date)}</td>  
                <td>${booking.period}</td>  
                <td>${booking.classroom}</td>  
                <td>${booking.name}</td>  <!-- 显示用户姓名 -->  
                <td>${booking.employeeId}</td>  <!-- 显示员工 ID -->  
                <td><button onclick="deleteBooking('${booking.id}')">删除</button></td>  
            `;  
            bookingTableBody.appendChild(row);  
        });  
    }).catch(error => {  
        alert('获取预定信息失败：' + error.message);  
    });  
}  


// 删除预定  
function deleteBooking(bookingId) {  
    const user = AV.User.current();  
    if (!user) {  
        alert('请先登录！');  
        return;  
    }  

    const booking = AV.Object.createWithoutData('Booking', bookingId);  
    booking.fetch().then(() => {  
        if (booking.get('userId') === user.id) {  
            return booking.destroy().then(() => {  
                alert('预定删除成功！');  
                checknow();  
            });  
        } else {  
            alert('你没有权限删除此预定！');  
        }  
    }).catch(error => {  
        alert('删除失败：' + error.message);  
    });  
}  

// 辅助函数：获取日期的星期几  
function getWeekday(dateString) {  
    const date = new Date(dateString);  
    const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];  
    return weekdays[date.getUTCDay()];  
}  
