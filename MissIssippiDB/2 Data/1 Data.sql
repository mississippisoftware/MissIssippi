-- use MissIssippiDB
-- go
delete Inventory 
go
delete StyleColor
go
delete Style 
go
delete ProductType
go
delete Season 
go
delete Color 
go
delete Sizes 
go

insert Sizes(SizeName, SizeSequence)
        select '12', 1
union select 'XXS', 2
union select 'XS', 3
union select 'S', 4
union select 'M', 5
union select 'L', 6
union select 'XL', 7

insert Color(ColorName)
      select 'Navy'
union select 'Kelly'
union select 'Eggplant'
union select 'Port Wine'
union select 'Turquoise'
union select 'Turquoise/Ivory'
union select 'Plum'
union select 'Ivory'
union select 'Black'
union select 'Black'
union select 'Ivory'
union select 'Royal'
union select 'Fuchsia'
union select 'Mustard'
union select 'Pink'
union select 'Rust'
union select 'Plum/Rust'
union select 'Forest Green'
union select 'Grey'
union select 'Corn Blue'
union select 'Oatmeal'
union select 'Lime'
union select 'Mint'
union select 'Mint/Fuchsia'
union select 'Burgundy'
union select 'Wine'
union select 'Royal'
union select 'Teal'
union select 'Black'
union select 'Dark Burgundy'
union select 'Eggplant'
union select 'Olive'
union select 'Teal'
union select 'Peach'
union select 'Natural'
union select 'Ivory/Black'
union select 'Dazzle/Black'
union select 'Admiral Blue'
union select 'Dark Rust'
union select 'Dazzle Blue'
union select 'Mauve'
union select 'Lavender'
union select 'Admiral'
union select 'Lt Blue'
union select 'Ivory/Eggplant'
union select 'Mid Blue'
union select 'Ivory'

insert Season(SeasonName, SeasonDateCreated, Active)
    select 'AW25', GETDATE(), 1


insert ProductType(ProductTypeName)
    select 'Top'
union select 'Skirt'
union select 'Dress'
union select 'Set'
union select 'Jacket'


;with x as (
      select StyleNumber = '701', [Description] = 'Miss Issippi', ProductTypeName = 'Top', CostPrice = null, WholesalePrice = null, SeasonName = 'AW25', StyleDateCreated = GETDATE(), InProduction = 0
union select StyleNumber = '702', [Description] = 'Miss Issippi', ProductTypeName = 'Top', CostPrice = null, WholesalePrice = null, SeasonName = 'AW25', StyleDateCreated = GETDATE(), InProduction = 0
union select StyleNumber = '703', [Description] = 'Miss Issippi', ProductTypeName = 'Top', CostPrice = null, WholesalePrice = null, SeasonName = 'AW25', StyleDateCreated = GETDATE(), InProduction = 0
union select StyleNumber = '704', [Description] = 'Miss Issippi', ProductTypeName = 'Top', CostPrice = null, WholesalePrice = null, SeasonName = 'AW25', StyleDateCreated = GETDATE(), InProduction = 0
union select StyleNumber = '705', [Description] = 'Miss Issippi', ProductTypeName = 'Top', CostPrice = null, WholesalePrice = null, SeasonName = 'AW25', StyleDateCreated = GETDATE(), InProduction = 0
union select StyleNumber = '705B', [Description] = 'Miss Issippi', ProductTypeName = 'Top', CostPrice = null, WholesalePrice = null, SeasonName = 'AW25', StyleDateCreated = GETDATE(), InProduction = 0
union select StyleNumber = '706', [Description] = 'Miss Issippi', ProductTypeName = 'Top', CostPrice = null, WholesalePrice = null, SeasonName = 'AW25', StyleDateCreated = GETDATE(), InProduction = 0
union select StyleNumber = '707', [Description] = 'Miss Issippi', ProductTypeName = 'Top', CostPrice = null, WholesalePrice = null, SeasonName = 'AW25', StyleDateCreated = GETDATE(), InProduction = 0
union select StyleNumber = '708', [Description] = 'Miss Issippi', ProductTypeName = 'Top', CostPrice = null, WholesalePrice = null, SeasonName = 'AW25', StyleDateCreated = GETDATE(), InProduction = 0
union select StyleNumber = '709', [Description] = 'Miss Issippi', ProductTypeName = 'Top', CostPrice = null, WholesalePrice = null, SeasonName = 'AW25', StyleDateCreated = GETDATE(), InProduction = 0
union select StyleNumber = '710', [Description] = 'Miss Issippi', ProductTypeName = 'Jacket', CostPrice = null, WholesalePrice = null, SeasonName = 'AW25', StyleDateCreated = GETDATE(), InProduction = 0
union select StyleNumber = '711', [Description] = 'Miss Issippi', ProductTypeName = 'Top', CostPrice = null, WholesalePrice = null, SeasonName = 'AW25', StyleDateCreated = GETDATE(), InProduction = 0
union select StyleNumber = '712', [Description] = 'Miss Issippi', ProductTypeName = 'Top', CostPrice = null, WholesalePrice = null, SeasonName = 'AW25', StyleDateCreated = GETDATE(), InProduction = 0
union select StyleNumber = '713', [Description] = 'Miss Issippi', ProductTypeName = 'Top', CostPrice = null, WholesalePrice = null, SeasonName = 'AW25', StyleDateCreated = GETDATE(), InProduction = 0
union select StyleNumber = '714', [Description] = 'Miss Issippi', ProductTypeName = 'Top', CostPrice = null, WholesalePrice = null, SeasonName = 'AW25', StyleDateCreated = GETDATE(), InProduction = 0
union select StyleNumber = '715', [Description] = 'Miss Issippi', ProductTypeName = 'Top', CostPrice = null, WholesalePrice = null, SeasonName = 'AW25', StyleDateCreated = GETDATE(), InProduction = 0
union select StyleNumber = '716', [Description] = 'Miss Issippi', ProductTypeName = 'Top', CostPrice = null, WholesalePrice = null, SeasonName = 'AW25', StyleDateCreated = GETDATE(), InProduction = 0
union select StyleNumber = '717', [Description] = 'Miss Issippi', ProductTypeName = 'Top', CostPrice = null, WholesalePrice = null, SeasonName = 'AW25', StyleDateCreated = GETDATE(), InProduction = 0
union select StyleNumber = '718', [Description] = 'Miss Issippi', ProductTypeName = 'Top', CostPrice = null, WholesalePrice = null, SeasonName = 'AW25', StyleDateCreated = GETDATE(), InProduction = 0
union select StyleNumber = '719', [Description] = 'Miss Issippi', ProductTypeName = 'Top', CostPrice = null, WholesalePrice = null, SeasonName = 'AW25', StyleDateCreated = GETDATE(), InProduction = 0
union select StyleNumber = '720', [Description] = 'Miss Issippi', ProductTypeName = 'Top', CostPrice = null, WholesalePrice = null, SeasonName = 'AW25', StyleDateCreated = GETDATE(), InProduction = 0
union select StyleNumber = '721', [Description] = 'Miss Issippi', ProductTypeName = 'Top', CostPrice = null, WholesalePrice = null, SeasonName = 'AW25', StyleDateCreated = GETDATE(), InProduction = 0
union select StyleNumber = '722', [Description] = 'Miss Issippi', ProductTypeName = 'Top', CostPrice = null, WholesalePrice = null, SeasonName = 'AW25', StyleDateCreated = GETDATE(), InProduction = 0
union select StyleNumber = '723', [Description] = 'Miss Issippi', ProductTypeName = 'Top', CostPrice = null, WholesalePrice = null, SeasonName = 'AW25', StyleDateCreated = GETDATE(), InProduction = 0
union select StyleNumber = '724', [Description] = 'Miss Issippi', ProductTypeName = 'Top', CostPrice = null, WholesalePrice = null, SeasonName = 'AW25', StyleDateCreated = GETDATE(), InProduction = 0
union select StyleNumber = '725', [Description] = 'Miss Issippi', ProductTypeName = 'Top', CostPrice = null, WholesalePrice = null, SeasonName = 'AW25', StyleDateCreated = GETDATE(), InProduction = 0
union select StyleNumber = '740', [Description] = 'Miss Issippi', ProductTypeName = 'Skirt', CostPrice = null, WholesalePrice = null, SeasonName = 'AW25', StyleDateCreated = GETDATE(), InProduction = 0
union select StyleNumber = '741', [Description] = 'Miss Issippi', ProductTypeName = 'Skirt', CostPrice = null, WholesalePrice = null, SeasonName = 'AW25', StyleDateCreated = GETDATE(), InProduction = 0
union select StyleNumber = '742', [Description] = 'Miss Issippi', ProductTypeName = 'Skirt', CostPrice = null, WholesalePrice = null, SeasonName = 'AW25', StyleDateCreated = GETDATE(), InProduction = 0
union select StyleNumber = '743', [Description] = 'Miss Issippi', ProductTypeName = 'Skirt', CostPrice = null, WholesalePrice = null, SeasonName = 'AW25', StyleDateCreated = GETDATE(), InProduction = 0
union select StyleNumber = '744', [Description] = 'Miss Issippi', ProductTypeName = 'Skirt', CostPrice = null, WholesalePrice = null, SeasonName = 'AW25', StyleDateCreated = GETDATE(), InProduction = 0
union select StyleNumber = '745', [Description] = 'Miss Issippi', ProductTypeName = 'Skirt', CostPrice = null, WholesalePrice = null, SeasonName = 'AW25', StyleDateCreated = GETDATE(), InProduction = 0
union select StyleNumber = '746', [Description] = 'Miss Issippi', ProductTypeName = 'Skirt', CostPrice = null, WholesalePrice = null, SeasonName = 'AW25', StyleDateCreated = GETDATE(), InProduction = 0
union select StyleNumber = '801', [Description] = 'Miss Issippi', ProductTypeName = 'Dress', CostPrice = null, WholesalePrice = null, SeasonName = 'AW25', StyleDateCreated = GETDATE(), InProduction = 0
union select StyleNumber = '802', [Description] = 'Miss Issippi', ProductTypeName = 'Dress', CostPrice = null, WholesalePrice = null, SeasonName = 'AW25', StyleDateCreated = GETDATE(), InProduction = 0
union select StyleNumber = '804', [Description] = 'Miss Issippi', ProductTypeName = 'Top', CostPrice = null, WholesalePrice = null, SeasonName = 'AW25', StyleDateCreated = GETDATE(), InProduction = 0
union select StyleNumber = '805', [Description] = 'Miss Issippi', ProductTypeName = 'Dress', CostPrice = null, WholesalePrice = null, SeasonName = 'AW25', StyleDateCreated = GETDATE(), InProduction = 0
union select StyleNumber = '806', [Description] = 'Miss Issippi', ProductTypeName = 'Set', CostPrice = null, WholesalePrice = null, SeasonName = 'AW25', StyleDateCreated = GETDATE(), InProduction = 0
union select StyleNumber = '807', [Description] = 'Miss Issippi', ProductTypeName = 'Top', CostPrice = null, WholesalePrice = null, SeasonName = 'AW25', StyleDateCreated = GETDATE(), InProduction = 0
union select StyleNumber = '809', [Description] = 'Miss Issippi', ProductTypeName = 'Dress', CostPrice = null, WholesalePrice = null, SeasonName = 'AW25', StyleDateCreated = GETDATE(), InProduction = 0
union select StyleNumber = '810', [Description] = 'Miss Issippi', ProductTypeName = 'Top', CostPrice = null, WholesalePrice = null, SeasonName = 'AW25', StyleDateCreated = GETDATE(), InProduction = 0
union select StyleNumber = '811', [Description] = 'Miss Issippi', ProductTypeName = 'Dress', CostPrice = null, WholesalePrice = null, SeasonName = 'AW25', StyleDateCreated = GETDATE(), InProduction = 0
union select StyleNumber = '812', [Description] = 'Miss Issippi', ProductTypeName = 'Top', CostPrice = null, WholesalePrice = null, SeasonName = 'AW25', StyleDateCreated = GETDATE(), InProduction = 0
union select StyleNumber = '813', [Description] = 'Miss Issippi', ProductTypeName = 'Top', CostPrice = null, WholesalePrice = null, SeasonName = 'AW25', StyleDateCreated = GETDATE(), InProduction = 0
union select StyleNumber = '814', [Description] = 'Miss Issippi', ProductTypeName = 'Top', CostPrice = null, WholesalePrice = null, SeasonName = 'AW25', StyleDateCreated = GETDATE(), InProduction = 0
union select StyleNumber = '815', [Description] = 'Miss Issippi', ProductTypeName = 'Dress', CostPrice = null, WholesalePrice = null, SeasonName = 'AW25', StyleDateCreated = GETDATE(), InProduction = 0
union select StyleNumber = '816', [Description] = 'Miss Issippi', ProductTypeName = 'Dress', CostPrice = null, WholesalePrice = null, SeasonName = 'AW25', StyleDateCreated = GETDATE(), InProduction = 0
union select StyleNumber = '817', [Description] = 'Miss Issippi', ProductTypeName = 'Top', CostPrice = null, WholesalePrice = null, SeasonName = 'AW25', StyleDateCreated = GETDATE(), InProduction = 0
union select StyleNumber = '818', [Description] = 'Miss Issippi', ProductTypeName = 'Top', CostPrice = null, WholesalePrice = null, SeasonName = 'AW25', StyleDateCreated = GETDATE(), InProduction = 0
union select StyleNumber = '819', [Description] = 'Miss Issippi', ProductTypeName = 'Dress', CostPrice = null, WholesalePrice = null, SeasonName = 'AW25', StyleDateCreated = GETDATE(), InProduction = 0
union select StyleNumber = '820', [Description] = 'Miss Issippi', ProductTypeName = 'Top', CostPrice = null, WholesalePrice = null, SeasonName = 'AW25', StyleDateCreated = GETDATE(), InProduction = 0
union select StyleNumber = '822', [Description] = 'Miss Issippi', ProductTypeName = 'Top', CostPrice = null, WholesalePrice = null, SeasonName = 'AW25', StyleDateCreated = GETDATE(), InProduction = 0
union select StyleNumber = '823', [Description] = 'Miss Issippi', ProductTypeName = 'Top', CostPrice = null, WholesalePrice = null, SeasonName = 'AW25', StyleDateCreated = GETDATE(), InProduction = 0
union select StyleNumber = '824', [Description] = 'Miss Issippi', ProductTypeName = 'Top', CostPrice = null, WholesalePrice = null, SeasonName = 'AW25', StyleDateCreated = GETDATE(), InProduction = 0
union select StyleNumber = '825', [Description] = 'Miss Issippi', ProductTypeName = 'Top', CostPrice = null, WholesalePrice = null, SeasonName = 'AW25', StyleDateCreated = GETDATE(), InProduction = 0
union select StyleNumber = '826', [Description] = 'Miss Issippi', ProductTypeName = 'Dress', CostPrice = null, WholesalePrice = null, SeasonName = 'AW25', StyleDateCreated = GETDATE(), InProduction = 0
union select StyleNumber = '827', [Description] = 'Miss Issippi', ProductTypeName = 'Top', CostPrice = null, WholesalePrice = null, SeasonName = 'AW25', StyleDateCreated = GETDATE(), InProduction = 0
union select StyleNumber = '828', [Description] = 'Miss Issippi', ProductTypeName = 'Top', CostPrice = null, WholesalePrice = null, SeasonName = 'AW25', StyleDateCreated = GETDATE(), InProduction = 0
union select StyleNumber = '829', [Description] = 'Miss Issippi', ProductTypeName = 'Top', CostPrice = null, WholesalePrice = null, SeasonName = 'AW25', StyleDateCreated = GETDATE(), InProduction = 0
union select StyleNumber = '830', [Description] = 'Miss Issippi', ProductTypeName = 'Dress', CostPrice = null, WholesalePrice = null, SeasonName = 'AW25', StyleDateCreated = GETDATE(), InProduction = 0
union select StyleNumber = '831', [Description] = 'Miss Issippi', ProductTypeName = 'Top', CostPrice = null, WholesalePrice = null, SeasonName = 'AW25', StyleDateCreated = GETDATE(), InProduction = 0
union select StyleNumber = '832', [Description] = 'Miss Issippi', ProductTypeName = 'Dress', CostPrice = null, WholesalePrice = null, SeasonName = 'AW25', StyleDateCreated = GETDATE(), InProduction = 0
union select StyleNumber = '833', [Description] = 'Miss Issippi', ProductTypeName = 'Dress', CostPrice = null, WholesalePrice = null, SeasonName = 'AW25', StyleDateCreated = GETDATE(), InProduction = 0
union select StyleNumber = '834', [Description] = 'Miss Issippi', ProductTypeName = 'Dress', CostPrice = null, WholesalePrice = null, SeasonName = 'AW25', StyleDateCreated = GETDATE(), InProduction = 0
union select StyleNumber = '840', [Description] = 'Miss Issippi', ProductTypeName = 'Skirt', CostPrice = null, WholesalePrice = null, SeasonName = 'AW25', StyleDateCreated = GETDATE(), InProduction = 0
union select StyleNumber = '841', [Description] = 'Miss Issippi', ProductTypeName = 'Skirt', CostPrice = null, WholesalePrice = null, SeasonName = 'AW25', StyleDateCreated = GETDATE(), InProduction = 0
union select StyleNumber = '842', [Description] = 'Miss Issippi', ProductTypeName = 'Skirt', CostPrice = null, WholesalePrice = null, SeasonName = 'AW25', StyleDateCreated = GETDATE(), InProduction = 0
union select StyleNumber = '843', [Description] = 'Miss Issippi', ProductTypeName = 'Skirt', CostPrice = null, WholesalePrice = null, SeasonName = 'AW25', StyleDateCreated = GETDATE(), InProduction = 0
union select StyleNumber = '844', [Description] = 'Miss Issippi', ProductTypeName = 'Skirt', CostPrice = null, WholesalePrice = null, SeasonName = 'AW25', StyleDateCreated = GETDATE(), InProduction = 0
union select StyleNumber = '845', [Description] = 'Miss Issippi', ProductTypeName = 'Skirt', CostPrice = null, WholesalePrice = null, SeasonName = 'AW25', StyleDateCreated = GETDATE(), InProduction = 0
union select StyleNumber = '846', [Description] = 'Miss Issippi', ProductTypeName = 'Skirt', CostPrice = null, WholesalePrice = null, SeasonName = 'AW25', StyleDateCreated = GETDATE(), InProduction = 0
union select StyleNumber = '847', [Description] = 'Miss Issippi', ProductTypeName = 'Skirt', CostPrice = null, WholesalePrice = null, SeasonName = 'AW25', StyleDateCreated = GETDATE(), InProduction = 0
union select StyleNumber = '848', [Description] = 'Miss Issippi', ProductTypeName = 'Skirt', CostPrice = null, WholesalePrice = null, SeasonName = 'AW25', StyleDateCreated = GETDATE(), InProduction = 0
union select StyleNumber = '849', [Description] = 'Miss Issippi', ProductTypeName = 'Skirt', CostPrice = null, WholesalePrice = null, SeasonName = 'AW25', StyleDateCreated = GETDATE(), InProduction = 0
union select StyleNumber = '850', [Description] = 'Miss Issippi', ProductTypeName = 'Skirt', CostPrice = null, WholesalePrice = null, SeasonName = 'AW25', StyleDateCreated = GETDATE(), InProduction = 0
union select StyleNumber = '851', [Description] = 'Miss Issippi', ProductTypeName = 'Skirt', CostPrice = null, WholesalePrice = null, SeasonName = 'AW25', StyleDateCreated = GETDATE(), InProduction = 0
union select StyleNumber = '852', [Description] = 'Miss Issippi', ProductTypeName = 'Skirt', CostPrice = null, WholesalePrice = null, SeasonName = 'AW25', StyleDateCreated = GETDATE(), InProduction = 0
union select StyleNumber = '853', [Description] = 'Miss Issippi', ProductTypeName = 'Skirt', CostPrice = null, WholesalePrice = null, SeasonName = 'AW25', StyleDateCreated = GETDATE(), InProduction = 0
union select StyleNumber = '854', [Description] = 'Miss Issippi', ProductTypeName = 'Skirt', CostPrice = null, WholesalePrice = null, SeasonName = 'AW25', StyleDateCreated = GETDATE(), InProduction = 0
union select StyleNumber = '855', [Description] = 'Miss Issippi', ProductTypeName = 'Skirt', CostPrice = null, WholesalePrice = null, SeasonName = 'AW25', StyleDateCreated = GETDATE(), InProduction = 0
union select StyleNumber = '856', [Description] = 'Miss Issippi', ProductTypeName = 'Skirt', CostPrice = null, WholesalePrice = null, SeasonName = 'AW25', StyleDateCreated = GETDATE(), InProduction = 0

)
insert into Style(StyleNumber, [Description], ProductTypeId, CostPrice, WholesalePrice, SeasonId, StyleDateCreated, InProduction)
select x.StyleNumber, x.[Description], pt.ProductTypeId, x.CostPrice, x.WholesalePrice, s.SeasonId, x.StyleDateCreated, x.InProduction
from x  
join ProductType pt 
on x.ProductTypeName = pt.ProductTypeName 
join Season s 
on x.SeasonName = s.SeasonName


;with x as (
      select StyleNumber = '701', ColorName = 'Navy'
union select StyleNumber = '702', ColorName = 'Kelly'
union select StyleNumber = '702', ColorName = 'Navy'
union select StyleNumber = '703', ColorName = 'Eggplant'
union select StyleNumber = '703', ColorName = 'Navy'
union select StyleNumber = '703', ColorName = 'Port Wine'
union select StyleNumber = '703', ColorName = 'Turquoise'
union select StyleNumber = '703', ColorName = 'Turquoise/Ivory'
union select StyleNumber = '704', ColorName = 'Plum'
union select StyleNumber = '704', ColorName = 'Ivory'
union select StyleNumber = '704', ColorName = 'Kelly'
union select StyleNumber = '705', ColorName = 'Black'
union select StyleNumber = '705B', ColorName = 'Black'
union select StyleNumber = '705', ColorName = 'Ivory'
union select StyleNumber = '705B', ColorName = 'Ivory'
union select StyleNumber = '706', ColorName = 'Royal'
union select StyleNumber = '706', ColorName = 'Fuchsia'
union select StyleNumber = '706', ColorName = 'Kelly'
union select StyleNumber = '707', ColorName = 'Mustard'
union select StyleNumber = '707', ColorName = 'Pink'
union select StyleNumber = '707', ColorName = 'Rust'
union select StyleNumber = '708', ColorName = 'Ivory'
union select StyleNumber = '708', ColorName = 'Plum/Rust'
union select StyleNumber = '709', ColorName = 'Forest Green'
union select StyleNumber = '709', ColorName = 'Port Wine'
union select StyleNumber = '710', ColorName = 'Black'
union select StyleNumber = '710', ColorName = 'Ivory'
union select StyleNumber = '711', ColorName = 'Grey'
union select StyleNumber = '711', ColorName = 'Ivory'
union select StyleNumber = '712', ColorName = 'Corn Blue'
union select StyleNumber = '712', ColorName = 'Mustard'
union select StyleNumber = '712', ColorName = 'Oatmeal'
union select StyleNumber = '712', ColorName = 'Rust'
union select StyleNumber = '713', ColorName = 'Rust'
union select StyleNumber = '714', ColorName = 'Corn Blue'
union select StyleNumber = '714', ColorName = 'Ivory'
union select StyleNumber = '715', ColorName = 'Eggplant'
union select StyleNumber = '716', ColorName = 'Eggplant'
union select StyleNumber = '716', ColorName = 'Lime'
union select StyleNumber = '717', ColorName = 'Black'
union select StyleNumber = '717', ColorName = 'Corn Blue'
union select StyleNumber = '717', ColorName = 'Eggplant'
union select StyleNumber = '718', ColorName = 'Black'
union select StyleNumber = '718', ColorName = 'Ivory'
union select StyleNumber = '719', ColorName = 'Corn Blue'
union select StyleNumber = '719', ColorName = 'Mint'
union select StyleNumber = '719', ColorName = 'Mint/Fuchsia'
union select StyleNumber = '720', ColorName = 'Burgundy'
union select StyleNumber = '720', ColorName = 'Eggplant'
union select StyleNumber = '720', ColorName = 'Ivory'
union select StyleNumber = '720', ColorName = 'Mustard'
union select StyleNumber = '721', ColorName = 'Eggplant'
union select StyleNumber = '721', ColorName = 'Wine'
union select StyleNumber = '722', ColorName = 'Ivory'
union select StyleNumber = '722', ColorName = 'Kelly'
union select StyleNumber = '722', ColorName = 'Mustard'
union select StyleNumber = '722', ColorName = 'Royal'
union select StyleNumber = '723', ColorName = 'Eggplant'
union select StyleNumber = '723', ColorName = 'Kelly'
union select StyleNumber = '723', ColorName = 'Ivory'
union select StyleNumber = '723', ColorName = 'Wine'
union select StyleNumber = '724', ColorName = 'Grey'
union select StyleNumber = '724', ColorName = 'Port Wine'
union select StyleNumber = '724', ColorName = 'Ivory'
union select StyleNumber = '724', ColorName = 'Royal'
union select StyleNumber = '725', ColorName = 'Black'
union select StyleNumber = '725', ColorName = 'Grey'
union select StyleNumber = '725', ColorName = 'Navy'
union select StyleNumber = '725', ColorName = 'Ivory'
union select StyleNumber = '740', ColorName = 'Black'
union select StyleNumber = '740', ColorName = 'Teal'
union select StyleNumber = '741', ColorName = 'Black'
union select StyleNumber = '741', ColorName = 'Dark Burgundy'
union select StyleNumber = '741', ColorName = 'Eggplant '
union select StyleNumber = '741', ColorName = 'Olive'
union select StyleNumber = '741', ColorName = 'Teal'
union select StyleNumber = '742', ColorName = 'Black'
union select StyleNumber = '742', ColorName = 'Teal'
union select StyleNumber = '743', ColorName = 'Black'
union select StyleNumber = '744', ColorName = 'Black'
union select StyleNumber = '744', ColorName = 'Pink'
union select StyleNumber = '745', ColorName = 'Grey'
union select StyleNumber = '745', ColorName = 'Port Wine'
union select StyleNumber = '746', ColorName = 'Black'
union select StyleNumber = '801', ColorName = 'Ivory'
union select StyleNumber = '801', ColorName = 'Royal'
union select StyleNumber = '802', ColorName = 'Navy'
union select StyleNumber = '802', ColorName = 'Peach'
union select StyleNumber = '804', ColorName = 'Natural'
union select StyleNumber = '805', ColorName = 'Royal'
union select StyleNumber = '806', ColorName = 'Ivory'
union select StyleNumber = '806', ColorName = 'Ivory/Black'
union select StyleNumber = '806', ColorName = 'Dazzle/Black'
union select StyleNumber = '806', ColorName = 'Navy'
union select StyleNumber = '807', ColorName = 'Admiral Blue'
union select StyleNumber = '807', ColorName = 'Dark Rust'
union select StyleNumber = '809', ColorName = 'Dazzle Blue'
union select StyleNumber = '809', ColorName = 'Eggplant'
union select StyleNumber = '809', ColorName = 'Ivory'
union select StyleNumber = '810', ColorName = 'Black'
union select StyleNumber = '810', ColorName = 'Ivory'
union select StyleNumber = '811', ColorName = 'Navy'
union select StyleNumber = '812', ColorName = 'Black'
union select StyleNumber = '812', ColorName = 'Mauve'
union select StyleNumber = '812', ColorName = 'Natural'
union select StyleNumber = '812', ColorName = 'Navy'
union select StyleNumber = '813', ColorName = 'Dark Burgundy'
union select StyleNumber = '813', ColorName = 'Lavender'
union select StyleNumber = '813', ColorName = 'Navy'
union select StyleNumber = '814', ColorName = 'Admiral'
union select StyleNumber = '814', ColorName = 'Wine'
union select StyleNumber = '815', ColorName = 'Navy'
union select StyleNumber = '816', ColorName = 'Eggplant'
union select StyleNumber = '816', ColorName = 'Port Wine'
union select StyleNumber = '817', ColorName = 'Eggplant'
union select StyleNumber = '817', ColorName = 'Lt Blue'
union select StyleNumber = '817', ColorName = 'Navy'
union select StyleNumber = '818', ColorName = 'Navy'
union select StyleNumber = '818', ColorName = 'Admiral Blue'
union select StyleNumber = '818', ColorName = 'Eggplant'
union select StyleNumber = '818', ColorName = 'Port Wine'
union select StyleNumber = '819', ColorName = 'Ivory'
union select StyleNumber = '819', ColorName = 'Mauve'
union select StyleNumber = '819', ColorName = 'Port Wine'
union select StyleNumber = '820', ColorName = 'Dark Rust'
union select StyleNumber = '820', ColorName = 'Natural'
union select StyleNumber = '820', ColorName = 'Port Wine'
union select StyleNumber = '822', ColorName = 'Admiral'
union select StyleNumber = '822', ColorName = 'Black'
union select StyleNumber = '822', ColorName = 'Ivory'
union select StyleNumber = '822', ColorName = 'Eggplant'
union select StyleNumber = '822', ColorName = 'Port Wine'
union select StyleNumber = '823', ColorName = 'Eggplant'
union select StyleNumber = '823', ColorName = 'Ivory'
union select StyleNumber = '823', ColorName = 'Port Wine'
union select StyleNumber = '824', ColorName = 'Black'
union select StyleNumber = '824', ColorName = 'Ivory'
union select StyleNumber = '825', ColorName = 'Black'
union select StyleNumber = '825', ColorName = 'Ivory'
union select StyleNumber = '825', ColorName = 'Ivory/Black'
union select StyleNumber = '825', ColorName = 'Ivory/Eggplant'
union select StyleNumber = '826', ColorName = 'Teal'
union select StyleNumber = '826', ColorName = 'Ivory'
union select StyleNumber = '826', ColorName = 'Turquoise'
union select StyleNumber = '827', ColorName = 'Black'
union select StyleNumber = '827', ColorName = 'Ivory'
union select StyleNumber = '828', ColorName = 'Ivory'
union select StyleNumber = '828', ColorName = 'Pink'
union select StyleNumber = '829', ColorName = 'Black'
union select StyleNumber = '829', ColorName = 'Ivory'
union select StyleNumber = '829', ColorName = 'Pink'
union select StyleNumber = '830', ColorName = 'Burgundy'
union select StyleNumber = '831', ColorName = 'Burgundy'
union select StyleNumber = '832', ColorName = 'Mid Blue'
union select StyleNumber = '833', ColorName = 'Teal'
union select StyleNumber = '834', ColorName = 'Teal'
union select StyleNumber = '834', ColorName = 'Ivory'
union select StyleNumber = '834', ColorName = 'Turquoise'
union select StyleNumber = '840', ColorName = 'Ivory'
union select StyleNumber = '840', ColorName = 'Navy'
union select StyleNumber = '840', ColorName = 'Black'
union select StyleNumber = '840', ColorName = 'Wine'
union select StyleNumber = '841', ColorName = 'Admiral'
union select StyleNumber = '841', ColorName = 'Black'
union select StyleNumber = '841', ColorName = 'Navy'
union select StyleNumber = '842', ColorName = 'Lavender'
union select StyleNumber = '842', ColorName = 'Navy'
union select StyleNumber = '843', ColorName = 'Black '
union select StyleNumber = '844', ColorName = 'Black'
union select StyleNumber = '844', ColorName = 'Navy'
union select StyleNumber = '844', ColorName = 'Ivory'
union select StyleNumber = '845', ColorName = 'Admiral Blue'
union select StyleNumber = '846', ColorName = 'Dark Rust'
union select StyleNumber = '847', ColorName = 'Black'
union select StyleNumber = '847', ColorName = 'Ivory'
union select StyleNumber = '847', ColorName = 'Wine'
union select StyleNumber = '848', ColorName = 'Black'
union select StyleNumber = '848', ColorName = 'Burgundy'
union select StyleNumber = '848', ColorName = 'Eggplant'
union select StyleNumber = '848', ColorName = 'Navy'
union select StyleNumber = '849', ColorName = 'Dark Burgundy'
union select StyleNumber = '850', ColorName = 'Admiral Blue'
union select StyleNumber = '850', ColorName = 'Eggplant'
union select StyleNumber = '850', ColorName = 'Port Wine'
union select StyleNumber = '851', ColorName = 'Black'
union select StyleNumber = '851', ColorName = 'Eggplant'
union select StyleNumber = '851', ColorName = 'Port Wine'
union select StyleNumber = '852', ColorName = 'Black'
union select StyleNumber = '852', ColorName = 'Wine'
union select StyleNumber = '852', ColorName = 'Ivory'
union select StyleNumber = '852', ColorName = 'Navy'
union select StyleNumber = '852', ColorName = 'Natural'
union select StyleNumber = '853', ColorName = 'Black'
union select StyleNumber = '853', ColorName = 'Ivory'
union select StyleNumber = '853', ColorName = 'Pink'
union select StyleNumber = '854', ColorName = 'Ivory'
union select StyleNumber = '854', ColorName = 'Black'
union select StyleNumber = '855', ColorName = 'Black'
union select StyleNumber = '855', ColorName = 'Ivory'
union select StyleNumber = '855', ColorName = 'Burgundy'
union select StyleNumber = '856', ColorName = 'Black'
union select StyleNumber = '856', ColorName = 'Ivory'
)
insert into StyleColor(StyleId, ColorId)
select s.StyleId, c.ColorId
from x 
join Style s 
on x.StyleNumber = s.StyleNumber 
join Color c 
on x.ColorName = c.ColorName


;with x as ( 
    select StyleNumber = '702', ColorName = 'Kelly', SizeName='XXS', Qty = 1
union select StyleNumber = '702', ColorName = 'Kelly', SizeName='XS', Qty = 2
union select StyleNumber = '702', ColorName = 'Kelly', SizeName='S', Qty = 3
union select StyleNumber = '702', ColorName = 'Kelly', SizeName='M', Qty = 4
union select StyleNumber = '702', ColorName = 'Kelly', SizeName='L', Qty = 5
union select StyleNumber = '702', ColorName = 'Kelly', SizeName='XL', Qty = 6
union select StyleNumber = '702', ColorName = 'Navy', SizeName='12', Qty = 7
union select StyleNumber = '702', ColorName = 'Navy', SizeName='XXS', Qty = 8
union select StyleNumber = '702', ColorName = 'Navy', SizeName='XS', Qty = 9
union select StyleNumber = '702', ColorName = 'Navy', SizeName='S', Qty = 10
union select StyleNumber = '702', ColorName = 'Navy', SizeName='M', Qty = 1
union select StyleNumber = '702', ColorName = 'Navy', SizeName='L', Qty = 2
union select StyleNumber = '702', ColorName = 'Navy', SizeName='XL', Qty = 3
union select StyleNumber = '717', ColorName = 'Black', SizeName='12', Qty = 4
union select StyleNumber = '717', ColorName = 'Black', SizeName='XXS', Qty = 5
union select StyleNumber = '717', ColorName = 'Black', SizeName='XS', Qty = 6
union select StyleNumber = '717', ColorName = 'Black', SizeName='S', Qty = 7
union select StyleNumber = '717', ColorName = 'Black', SizeName='M', Qty = 8
union select StyleNumber = '717', ColorName = 'Black', SizeName='L', Qty = 9
union select StyleNumber = '717', ColorName = 'Black', SizeName='XL', Qty = 10
union select StyleNumber = '717', ColorName = 'Corn Blue', SizeName='12', Qty = 11
union select StyleNumber = '717', ColorName = 'Corn Blue', SizeName='XXS', Qty = 12
union select StyleNumber = '717', ColorName = 'Corn Blue', SizeName='XS', Qty = 13
union select StyleNumber = '717', ColorName = 'Corn Blue', SizeName='S', Qty = 1
union select StyleNumber = '717', ColorName = 'Corn Blue', SizeName='M', Qty = 2
union select StyleNumber = '717', ColorName = 'Corn Blue', SizeName='L', Qty = 3
union select StyleNumber = '717', ColorName = 'Corn Blue', SizeName='XL', Qty = 4
union select StyleNumber = '717', ColorName = 'Eggplant', SizeName='12', Qty = 5
union select StyleNumber = '717', ColorName = 'Eggplant', SizeName='XXS', Qty = 6
union select StyleNumber = '717', ColorName = 'Eggplant', SizeName='XS', Qty = 7
union select StyleNumber = '717', ColorName = 'Eggplant', SizeName='S', Qty = 8
union select StyleNumber = '717', ColorName = 'Eggplant', SizeName='M', Qty = 9
union select StyleNumber = '717', ColorName = 'Eggplant', SizeName='L', Qty = 10
union select StyleNumber = '717', ColorName = 'Eggplant', SizeName='XL', Qty = 11
union select StyleNumber = '719', ColorName = 'Corn Blue', SizeName='12', Qty = 12
union select StyleNumber = '719', ColorName = 'Corn Blue', SizeName='XXS', Qty = 13
union select StyleNumber = '719', ColorName = 'Corn Blue', SizeName='XS', Qty = 1
union select StyleNumber = '719', ColorName = 'Corn Blue', SizeName='S', Qty = 2
union select StyleNumber = '719', ColorName = 'Corn Blue', SizeName='M', Qty = 3
union select StyleNumber = '719', ColorName = 'Corn Blue', SizeName='L', Qty = 4
union select StyleNumber = '719', ColorName = 'Corn Blue', SizeName='XL', Qty = 5
union select StyleNumber = '719', ColorName = 'Mint', SizeName='12', Qty = 6
union select StyleNumber = '719', ColorName = 'Mint', SizeName='XXS', Qty = 7
union select StyleNumber = '719', ColorName = 'Mint', SizeName='XS', Qty = 8
union select StyleNumber = '719', ColorName = 'Mint', SizeName='S', Qty = 9
union select StyleNumber = '719', ColorName = 'Mint', SizeName='M', Qty = 10
union select StyleNumber = '719', ColorName = 'Mint', SizeName='L', Qty = 11
union select StyleNumber = '719', ColorName = 'Mint', SizeName='XL', Qty = 12
union select StyleNumber = '719', ColorName = 'Mint/Fuchsia', SizeName='12', Qty = 13
union select StyleNumber = '719', ColorName = 'Mint/Fuchsia', SizeName='XXS', Qty = 1
union select StyleNumber = '719', ColorName = 'Mint/Fuchsia', SizeName='XS', Qty = 2
union select StyleNumber = '719', ColorName = 'Mint/Fuchsia', SizeName='S', Qty = 3
union select StyleNumber = '719', ColorName = 'Mint/Fuchsia', SizeName='M', Qty = 4
union select StyleNumber = '719', ColorName = 'Mint/Fuchsia', SizeName='L', Qty = 5
union select StyleNumber = '719', ColorName = 'Mint/Fuchsia', SizeName='XL', Qty = 6
union select StyleNumber = '720', ColorName = 'Burgundy', SizeName='12', Qty = 7
union select StyleNumber = '720', ColorName = 'Burgundy', SizeName='XXS', Qty = 8
union select StyleNumber = '720', ColorName = 'Burgundy', SizeName='XS', Qty = 9
union select StyleNumber = '720', ColorName = 'Burgundy', SizeName='S', Qty = 10
union select StyleNumber = '720', ColorName = 'Burgundy', SizeName='M', Qty = 11
union select StyleNumber = '720', ColorName = 'Burgundy', SizeName='L', Qty = 12
union select StyleNumber = '720', ColorName = 'Burgundy', SizeName='XL', Qty = 13
union select StyleNumber = '720', ColorName = 'Eggplant', SizeName='12', Qty = 1
union select StyleNumber = '720', ColorName = 'Eggplant', SizeName='XXS', Qty = 2
union select StyleNumber = '720', ColorName = 'Eggplant', SizeName='XS', Qty = 3
union select StyleNumber = '720', ColorName = 'Eggplant', SizeName='S', Qty = 4
union select StyleNumber = '720', ColorName = 'Eggplant', SizeName='M', Qty = 5
union select StyleNumber = '720', ColorName = 'Eggplant', SizeName='L', Qty = 6
union select StyleNumber = '720', ColorName = 'Eggplant', SizeName='XL', Qty = 7
union select StyleNumber = '720', ColorName = 'Ivory', SizeName='12', Qty = 8
union select StyleNumber = '720', ColorName = 'Ivory', SizeName='XXS', Qty = 9
union select StyleNumber = '720', ColorName = 'Ivory', SizeName='XS', Qty = 10
union select StyleNumber = '720', ColorName = 'Ivory', SizeName='S', Qty = 11
union select StyleNumber = '720', ColorName = 'Ivory', SizeName='M', Qty = 12
union select StyleNumber = '720', ColorName = 'Ivory', SizeName='L', Qty = 13
union select StyleNumber = '720', ColorName = 'Ivory', SizeName='XL', Qty = 1
union select StyleNumber = '720', ColorName = 'Mustard', SizeName='12', Qty = 2
union select StyleNumber = '720', ColorName = 'Mustard', SizeName='XXS', Qty = 3
union select StyleNumber = '720', ColorName = 'Mustard', SizeName='XS', Qty = 4
union select StyleNumber = '720', ColorName = 'Mustard', SizeName='S', Qty = 5
union select StyleNumber = '720', ColorName = 'Mustard', SizeName='M', Qty = 6
union select StyleNumber = '720', ColorName = 'Mustard', SizeName='L', Qty = 7
union select StyleNumber = '720', ColorName = 'Mustard', SizeName='XL', Qty = 8
union select StyleNumber = '722', ColorName = 'Ivory', SizeName='12', Qty = 9
union select StyleNumber = '722', ColorName = 'Ivory', SizeName='XXS', Qty = 10
union select StyleNumber = '722', ColorName = 'Ivory', SizeName='XS', Qty = 11
union select StyleNumber = '722', ColorName = 'Ivory', SizeName='S', Qty = 12
union select StyleNumber = '722', ColorName = 'Ivory', SizeName='M', Qty = 13
union select StyleNumber = '722', ColorName = 'Ivory', SizeName='L', Qty = 1
union select StyleNumber = '722', ColorName = 'Ivory', SizeName='XL', Qty = 2
union select StyleNumber = '722', ColorName = 'Kelly', SizeName='12', Qty = 3
union select StyleNumber = '722', ColorName = 'Kelly', SizeName='XXS', Qty = 4
union select StyleNumber = '722', ColorName = 'Kelly', SizeName='XS', Qty = 5
union select StyleNumber = '722', ColorName = 'Kelly', SizeName='S', Qty = 6
union select StyleNumber = '722', ColorName = 'Kelly', SizeName='M', Qty = 7
union select StyleNumber = '722', ColorName = 'Kelly', SizeName='L', Qty = 8
union select StyleNumber = '722', ColorName = 'Kelly', SizeName='XL', Qty = 9
union select StyleNumber = '722', ColorName = 'Mustard', SizeName='12', Qty = 10
union select StyleNumber = '722', ColorName = 'Mustard', SizeName='XXS', Qty = 11
union select StyleNumber = '722', ColorName = 'Mustard', SizeName='XS', Qty = 12
union select StyleNumber = '722', ColorName = 'Mustard', SizeName='S', Qty = 13
union select StyleNumber = '722', ColorName = 'Mustard', SizeName='M', Qty = 1
union select StyleNumber = '722', ColorName = 'Mustard', SizeName='L', Qty = 2
union select StyleNumber = '722', ColorName = 'Mustard', SizeName='XL', Qty = 3
union select StyleNumber = '722', ColorName = 'Royal', SizeName='12', Qty = 4
union select StyleNumber = '722', ColorName = 'Royal', SizeName='XXS', Qty = 5
union select StyleNumber = '722', ColorName = 'Royal', SizeName='XS', Qty = 6
union select StyleNumber = '722', ColorName = 'Royal', SizeName='S', Qty = 7
union select StyleNumber = '722', ColorName = 'Royal', SizeName='M', Qty = 8
union select StyleNumber = '722', ColorName = 'Royal', SizeName='L', Qty = 9
union select StyleNumber = '722', ColorName = 'Royal', SizeName='XL', Qty = 10
union select StyleNumber = '724', ColorName = 'Grey', SizeName='12', Qty = 11
union select StyleNumber = '724', ColorName = 'Grey', SizeName='XXS', Qty = 12
union select StyleNumber = '724', ColorName = 'Grey', SizeName='XS', Qty = 13
union select StyleNumber = '724', ColorName = 'Grey', SizeName='S', Qty = 1
union select StyleNumber = '724', ColorName = 'Grey', SizeName='M', Qty = 2
union select StyleNumber = '724', ColorName = 'Grey', SizeName='L', Qty = 3
union select StyleNumber = '724', ColorName = 'Grey', SizeName='XL', Qty = 4
union select StyleNumber = '724', ColorName = 'Port Wine', SizeName='12', Qty = 5
union select StyleNumber = '724', ColorName = 'Port Wine', SizeName='XXS', Qty = 6
union select StyleNumber = '724', ColorName = 'Port Wine', SizeName='XS', Qty = 7
union select StyleNumber = '724', ColorName = 'Port Wine', SizeName='S', Qty = 8
union select StyleNumber = '724', ColorName = 'Port Wine', SizeName='M', Qty = 9
union select StyleNumber = '724', ColorName = 'Port Wine', SizeName='L', Qty = 10
union select StyleNumber = '724', ColorName = 'Port Wine', SizeName='XL', Qty = 11
union select StyleNumber = '724', ColorName = 'Royal', SizeName='12', Qty = 12
union select StyleNumber = '724', ColorName = 'Royal', SizeName='XXS', Qty = 13
union select StyleNumber = '724', ColorName = 'Royal', SizeName='XS', Qty = 1
union select StyleNumber = '724', ColorName = 'Royal', SizeName='S', Qty = 2
union select StyleNumber = '724', ColorName = 'Royal', SizeName='M', Qty = 3
union select StyleNumber = '724', ColorName = 'Royal', SizeName='L', Qty = 4
union select StyleNumber = '724', ColorName = 'Royal', SizeName='XL', Qty = 5
union select StyleNumber = '724', ColorName = 'Ivory', SizeName='12', Qty = 6
union select StyleNumber = '724', ColorName = 'Ivory', SizeName='XXS', Qty = 7
union select StyleNumber = '724', ColorName = 'Ivory', SizeName='XS', Qty = 8
union select StyleNumber = '724', ColorName = 'Ivory', SizeName='S', Qty = 9
union select StyleNumber = '724', ColorName = 'Ivory', SizeName='M', Qty = 10
union select StyleNumber = '724', ColorName = 'Ivory', SizeName='L', Qty = 11
union select StyleNumber = '724', ColorName = 'Ivory', SizeName='XL', Qty = 12
union select StyleNumber = '724', ColorName = 'Royal', SizeName='12', Qty = 13
union select StyleNumber = '724', ColorName = 'Royal', SizeName='XXS', Qty = 1
union select StyleNumber = '724', ColorName = 'Royal', SizeName='XS', Qty = 2
union select StyleNumber = '724', ColorName = 'Royal', SizeName='S', Qty = 3
union select StyleNumber = '724', ColorName = 'Royal', SizeName='M', Qty = 4
union select StyleNumber = '724', ColorName = 'Royal', SizeName='L', Qty = 5
union select StyleNumber = '724', ColorName = 'Royal', SizeName='XL', Qty = 6
union select StyleNumber = '725', ColorName = 'Black', SizeName='12', Qty = 7
union select StyleNumber = '725', ColorName = 'Black', SizeName='XXS', Qty = 8
union select StyleNumber = '725', ColorName = 'Black', SizeName='XS', Qty = 9
union select StyleNumber = '725', ColorName = 'Black', SizeName='S', Qty = 10
union select StyleNumber = '725', ColorName = 'Black', SizeName='M', Qty = 11
union select StyleNumber = '725', ColorName = 'Black', SizeName='L', Qty = 12
union select StyleNumber = '725', ColorName = 'Black', SizeName='XL', Qty = 13
union select StyleNumber = '725', ColorName = 'Grey', SizeName='12', Qty = 1

union select StyleNumber = '725', ColorName = 'Grey', SizeName='XXS', Qty = 2

union select StyleNumber = '725', ColorName = 'Grey', SizeName='XS', Qty = 3

union select StyleNumber = '725', ColorName = 'Grey', SizeName='S', Qty = 4

union select StyleNumber = '725', ColorName = 'Grey', SizeName='M', Qty = 5

union select StyleNumber = '725', ColorName = 'Grey', SizeName='L', Qty = 6

union select StyleNumber = '725', ColorName = 'Grey', SizeName='XL', Qty = 7

union select StyleNumber = '725', ColorName = 'Navy', SizeName='12', Qty = 8

union select StyleNumber = '725', ColorName = 'Navy', SizeName='XXS', Qty = 9

union select StyleNumber = '725', ColorName = 'Navy', SizeName='XS', Qty = 10

union select StyleNumber = '725', ColorName = 'Navy', SizeName='S', Qty = 11

union select StyleNumber = '725', ColorName = 'Navy', SizeName='M', Qty = 12

union select StyleNumber = '725', ColorName = 'Navy', SizeName='L', Qty = 13

union select StyleNumber = '725', ColorName = 'Navy', SizeName='XL', Qty = 1

union select StyleNumber = '725', ColorName = 'Ivory', SizeName='12', Qty = 2

union select StyleNumber = '725', ColorName = 'Ivory', SizeName='XXS', Qty = 3

union select StyleNumber = '725', ColorName = 'Ivory', SizeName='XS', Qty = 4

union select StyleNumber = '725', ColorName = 'Ivory', SizeName='S', Qty = 5

union select StyleNumber = '725', ColorName = 'Ivory', SizeName='M', Qty = 6

union select StyleNumber = '725', ColorName = 'Ivory', SizeName='L', Qty = 7

union select StyleNumber = '725', ColorName = 'Ivory', SizeName='XL', Qty = 8

union select StyleNumber = '818', ColorName = 'Navy', SizeName='12', Qty = 9

union select StyleNumber = '818', ColorName = 'Navy', SizeName='XXS', Qty = 10

union select StyleNumber = '818', ColorName = 'Navy', SizeName='XS', Qty = 11

union select StyleNumber = '818', ColorName = 'Navy', SizeName='S', Qty = 12

union select StyleNumber = '818', ColorName = 'Navy', SizeName='M', Qty = 13

union select StyleNumber = '818', ColorName = 'Navy', SizeName='L', Qty = 1

union select StyleNumber = '818', ColorName = 'Navy', SizeName='XL', Qty = 2

union select StyleNumber = '818', ColorName = 'Admiral Blue', SizeName='12', Qty = 3

union select StyleNumber = '818', ColorName = 'Admiral Blue', SizeName='XXS', Qty = 4

union select StyleNumber = '818', ColorName = 'Admiral Blue', SizeName='XS', Qty = 5

union select StyleNumber = '818', ColorName = 'Admiral Blue', SizeName='S', Qty = 6

union select StyleNumber = '818', ColorName = 'Admiral Blue', SizeName='M', Qty = 7

union select StyleNumber = '818', ColorName = 'Admiral Blue', SizeName='L', Qty = 8

union select StyleNumber = '818', ColorName = 'Admiral Blue', SizeName='XL', Qty = 9

union select StyleNumber = '818', ColorName = 'Eggplant', SizeName='12', Qty = 10

union select StyleNumber = '818', ColorName = 'Eggplant', SizeName='XXS', Qty = 11

union select StyleNumber = '818', ColorName = 'Eggplant', SizeName='XS', Qty = 12

union select StyleNumber = '818', ColorName = 'Eggplant', SizeName='S', Qty = 13

union select StyleNumber = '818', ColorName = 'Eggplant', SizeName='M', Qty = 1

union select StyleNumber = '818', ColorName = 'Eggplant', SizeName='L', Qty = 2

union select StyleNumber = '818', ColorName = 'Eggplant', SizeName='XL', Qty = 3

union select StyleNumber = '818', ColorName = 'Port Wine', SizeName='12', Qty = 4

union select StyleNumber = '818', ColorName = 'Port Wine', SizeName='XXS', Qty = 5

union select StyleNumber = '818', ColorName = 'Port Wine', SizeName='XS', Qty = 6

union select StyleNumber = '818', ColorName = 'Port Wine', SizeName='S', Qty = 7

union select StyleNumber = '818', ColorName = 'Port Wine', SizeName='M', Qty = 8

union select StyleNumber = '818', ColorName = 'Port Wine', SizeName='L', Qty = 9

union select StyleNumber = '818', ColorName = 'Port Wine', SizeName='XL', Qty = 10

union select StyleNumber = '820', ColorName = 'Dark Rust', SizeName='12', Qty = 11

union select StyleNumber = '820', ColorName = 'Dark Rust', SizeName='XXS', Qty = 12

union select StyleNumber = '820', ColorName = 'Dark Rust', SizeName='XS', Qty = 13

union select StyleNumber = '820', ColorName = 'Dark Rust', SizeName='S', Qty = 1

union select StyleNumber = '820', ColorName = 'Dark Rust', SizeName='M', Qty = 2

union select StyleNumber = '820', ColorName = 'Dark Rust', SizeName='L', Qty = 3

union select StyleNumber = '820', ColorName = 'Dark Rust', SizeName='XL', Qty = 4

union select StyleNumber = '820', ColorName = 'Natural', SizeName='12', Qty = 5

union select StyleNumber = '820', ColorName = 'Natural', SizeName='XXS', Qty = 6

union select StyleNumber = '820', ColorName = 'Natural', SizeName='XS', Qty = 7

union select StyleNumber = '820', ColorName = 'Natural', SizeName='S', Qty = 8

union select StyleNumber = '820', ColorName = 'Natural', SizeName='M', Qty = 9

union select StyleNumber = '820', ColorName = 'Natural', SizeName='L', Qty = 10

union select StyleNumber = '820', ColorName = 'Natural', SizeName='XL', Qty = 11

union select StyleNumber = '820', ColorName = 'Port Wine', SizeName='12', Qty = 12

union select StyleNumber = '820', ColorName = 'Port Wine', SizeName='XXS', Qty = 13

union select StyleNumber = '820', ColorName = 'Port Wine', SizeName='XS', Qty = 1

union select StyleNumber = '820', ColorName = 'Port Wine', SizeName='S', Qty = 2

union select StyleNumber = '820', ColorName = 'Port Wine', SizeName='M', Qty = 3

union select StyleNumber = '820', ColorName = 'Port Wine', SizeName='L', Qty = 4

union select StyleNumber = '820', ColorName = 'Port Wine', SizeName='XL', Qty = 5

union select StyleNumber = '822', ColorName = 'Admiral', SizeName='12', Qty = 6

union select StyleNumber = '822', ColorName = 'Admiral', SizeName='XXS', Qty = 7

union select StyleNumber = '822', ColorName = 'Admiral', SizeName='XS', Qty = 8

union select StyleNumber = '822', ColorName = 'Admiral', SizeName='S', Qty = 9

union select StyleNumber = '822', ColorName = 'Admiral', SizeName='M', Qty = 10

union select StyleNumber = '822', ColorName = 'Admiral', SizeName='L', Qty = 11

union select StyleNumber = '822', ColorName = 'Admiral', SizeName='XL', Qty = 12

union select StyleNumber = '822', ColorName = 'Black', SizeName='12', Qty = 13

union select StyleNumber = '822', ColorName = 'Black', SizeName='XXS', Qty = 1

union select StyleNumber = '822', ColorName = 'Black', SizeName='XS', Qty = 2

union select StyleNumber = '822', ColorName = 'Black', SizeName='S', Qty = 3

union select StyleNumber = '822', ColorName = 'Black', SizeName='M', Qty = 4

union select StyleNumber = '822', ColorName = 'Black', SizeName='L', Qty = 5

union select StyleNumber = '822', ColorName = 'Black', SizeName='XL', Qty = 6

union select StyleNumber = '822', ColorName = 'Ivory', SizeName='12', Qty = 7

union select StyleNumber = '822', ColorName = 'Ivory', SizeName='XXS', Qty = 8

union select StyleNumber = '822', ColorName = 'Ivory', SizeName='XS', Qty = 9

union select StyleNumber = '822', ColorName = 'Ivory', SizeName='S', Qty = 10

union select StyleNumber = '822', ColorName = 'Ivory', SizeName='M', Qty = 11

union select StyleNumber = '822', ColorName = 'Ivory', SizeName='L', Qty = 12

union select StyleNumber = '822', ColorName = 'Ivory', SizeName='XL', Qty = 13

union select StyleNumber = '822', ColorName = 'Eggplant', SizeName='12', Qty = 1

union select StyleNumber = '822', ColorName = 'Eggplant', SizeName='XXS', Qty = 2

union select StyleNumber = '822', ColorName = 'Eggplant', SizeName='XS', Qty = 3

union select StyleNumber = '822', ColorName = 'Eggplant', SizeName='S', Qty = 4

union select StyleNumber = '822', ColorName = 'Eggplant', SizeName='M', Qty = 5

union select StyleNumber = '822', ColorName = 'Eggplant', SizeName='L', Qty = 6

union select StyleNumber = '822', ColorName = 'Eggplant', SizeName='XL', Qty = 7

union select StyleNumber = '822', ColorName = 'Port Wine', SizeName='12', Qty = 8

union select StyleNumber = '822', ColorName = 'Port Wine', SizeName='XXS', Qty = 9

union select StyleNumber = '822', ColorName = 'Port Wine', SizeName='XS', Qty = 10

union select StyleNumber = '822', ColorName = 'Port Wine', SizeName='S', Qty = 11

union select StyleNumber = '822', ColorName = 'Port Wine', SizeName='M', Qty = 12

union select StyleNumber = '822', ColorName = 'Port Wine', SizeName='L', Qty = 13

union select StyleNumber = '822', ColorName = 'Port Wine', SizeName='XL', Qty = 1
)
insert into Inventory(StyleColorId, SizeId, Qty)
select sc.StyleColorId, sz.SizeId, x.Qty
from x 
join Style s 
on s.StyleNumber = x.StyleNumber
join Color c 
on c.ColorName = x.ColorName
join StyleColor sc 
on s.StyleId = sc.StyleId 
and c.ColorId = sc.ColorId
join Sizes sz 
on sz.SizeName = x.SizeName

