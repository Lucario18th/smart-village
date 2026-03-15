using System.Windows;
using SmartVillageWPF.ViewModels;

namespace SmartVillageWPF;

/// <summary>
/// Code-behind for MainWindow. Only handles bootstrap wiring.
/// All business logic is in MainViewModel.
/// </summary>
public partial class MainWindow : Window
{
    public MainWindow(MainViewModel viewModel)
    {
        InitializeComponent();
        DataContext = viewModel;

        Loaded += async (_, _) =>
        {
            await viewModel.LoadVillagesCommand.ExecuteAsync(null);
        };
    }
}