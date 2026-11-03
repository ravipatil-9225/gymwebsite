###############################################################################
#  Register-GymAutoStart.ps1
#  Run this ONCE as Administrator to register the gym services as a
#  Windows Task Scheduler task that fires on every PC startup.
#
#  Usage (in an elevated PowerShell window):
#     .\Register-GymAutoStart.ps1
###############################################################################

$TaskName   = "TaraFitnessGymAutoStart"
$ScriptPath = "D:\GYM WEBSITE\start-gym-services.bat"
$Description = "Automatically starts the Tara Fitness gym backend server and biometric agent on PC boot."

# Remove any existing version of the task
Unregister-ScheduledTask -TaskName $TaskName -Confirm:$false -ErrorAction SilentlyContinue

$Action  = New-ScheduledTaskAction  -Execute "cmd.exe" -Argument "/c `"$ScriptPath`""
$Trigger = New-ScheduledTaskTrigger -AtStartup
$Settings = New-ScheduledTaskSettingsSet `
    -ExecutionTimeLimit (New-TimeSpan -Hours 1) `
    -RestartCount 3 `
    -RestartInterval (New-TimeSpan -Minutes 1) `
    -StartWhenAvailable

# Run as SYSTEM so it fires even when no user is logged in
$Principal = New-ScheduledTaskPrincipal -UserId "SYSTEM" -LogonType ServiceAccount -RunLevel Highest

Register-ScheduledTask `
    -TaskName   $TaskName `
    -Description $Description `
    -Action     $Action `
    -Trigger    $Trigger `
    -Settings   $Settings `
    -Principal  $Principal

Write-Host ""
Write-Host "✅ Task '$TaskName' registered successfully." -ForegroundColor Green
Write-Host "   It will run '$ScriptPath' on every Windows startup."
Write-Host "   To test immediately: Start-ScheduledTask -TaskName '$TaskName'"
Write-Host "   To remove:           Unregister-ScheduledTask -TaskName '$TaskName' -Confirm:`$false"

